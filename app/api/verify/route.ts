import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { genAI } from '@/lib/gemini';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { z } from 'zod';

/* ------------------ CONFIG ------------------ */
const PRIMARY_MODEL = 'gemini-2.5-pro';
const FALLBACK_MODEL = 'gemini-2.5-flash';

const CB_WINDOW_MS = 60_000;
const CB_FAILURE_THRESHOLD = 3;
const CB_COOLDOWN_MS = 2 * 60_000;

type CircuitBreakerState = { failures: number; firstFailureTs: number; openUntil?: number };
const circuitState: Record<string, CircuitBreakerState> = {};

/* ------------------ HELPERS / UTILITIDADES ------------------ */

class HttpError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
  }
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return typeof err === 'string' ? err : JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function isCircuitOpen(modelName: string): boolean {
  const state = circuitState[modelName];
  if (!state) return false;
  if (state.openUntil && Date.now() < state.openUntil) return true;
  if (state.openUntil && Date.now() >= state.openUntil) {
    delete circuitState[modelName];
  }
  return false;
}

function recordCircuitFailure(modelName: string) {
  const now = Date.now();
  const state = circuitState[modelName] || { failures: 0, firstFailureTs: now };
  if (now - state.firstFailureTs > CB_WINDOW_MS) {
    state.failures = 1;
    state.firstFailureTs = now;
  } else {
    state.failures += 1;
  }
  if (state.failures >= CB_FAILURE_THRESHOLD) {
    state.openUntil = now + CB_COOLDOWN_MS;
    console.warn(`[CIRCUIT] opened for ${modelName} until ${new Date(state.openUntil).toISOString()}`);
  }
  circuitState[modelName] = state;
}

function recordCircuitSuccess(modelName: string) {
  delete circuitState[modelName];
}

/* Heurística UI */
function isLikelyUISnippet(text: string): boolean {
  if (!text) return true;
  const MIN_WORDS_ARTICLE = 50;
  if (text.trim().split(/\s+/).length < MIN_WORDS_ARTICLE) return true;
  const uiPatterns = [
    /sign in/i,
    /iniciar sesión/i,
    /mi cuenta/i,
    /@[\w.-]+\.\w{2,}/,
    /\b(CTRL|ALT|CMD|SHIFT)\b/i,
    /aria-label/i,
    /keyboard shortcut/i,
  ];
  return uiPatterns.some((re) => re.test(text));
}

async function extractArticleServerSide(url?: string | null): Promise<{ title: string | null; content: string | null } | null> {
  if (!url) return null;
  const ABORT_MS = 8_000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ABORT_MS);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'EsPosta/1.0 (+https://esposta.example)' }, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) {
      console.warn('[extractArticle] non-OK response', res.status);
      return null;
    }
    const html = await res.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    if (!article || !article.textContent) return null;
    return {
      title: typeof article.title === 'string' ? article.title : null,
      content: typeof article.textContent === 'string' ? article.textContent : null,
    };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.warn('[extractArticle] fetch abortado (timeout)');
    } else {
      console.warn('[extractArticle] Fallo', err?.message ?? err);
    }
    return null;
  } finally {
    clearTimeout(id);
  }
}

function sanitizePII(text: string): string {
  if (!text) return text;
  text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
  text = text.replace(/\+?\d[\d\s().-]{6,}\d/g, '[REDACTED_PHONE]');
  return text;
}

/* Zod schema */
const AnalysisSchema = z.object({
  source: z.object({ type: z.string().min(1), bias: z.string(), reputation: z.string() }),
  alerts: z.array(z.object({ id: z.number(), type: z.string(), text: z.string() })),
  context: z.string(),
  questions: z.array(z.object({ id: z.number(), text: z.string() })),
});

async function attemptGenerate(modelName: string, prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: modelName });
  const result: any = await model.generateContent(prompt as any);

  async function extractText(obj: any, depth = 0): Promise<string | null> {
    if (obj == null) return null;
    if (depth > 6) return null;

    if (typeof obj === 'string' && obj.trim().length > 0) return obj;

    if (typeof obj.text === 'function') {
      try {
        const maybe = obj.text();
        return typeof maybe === 'string' ? maybe : String(await maybe);
      } catch (e) {
        console.warn('[attemptGenerate] error al ejecutar text():', getErrorMessage(e));
      }
    }

    if (obj.response !== undefined) {
      const out = await extractText(obj.response, depth + 1);
      if (out) return out;
    }

    const arrayKeys = ['output', 'candidates', 'content', 'results', 'choices'];
    for (const key of arrayKeys) {
      const val = obj[key];
      if (Array.isArray(val) && val.length) {
        for (const item of val) {
          const extracted = await extractText(item, depth + 1);
          if (extracted) return extracted;
        }
      }
    }

    if (typeof obj.text === 'string' && obj.text.trim().length > 0) return obj.text;
    if (typeof obj.generated_text === 'string' && obj.generated_text.trim().length > 0) return obj.generated_text;
    if (typeof obj.outputText === 'string' && obj.outputText.trim().length > 0) return obj.outputText;

    try {
      for (const k of Object.keys(obj)) {
        const v = obj[k];
        if (typeof v === 'string' && v.trim().length > 0) return v;
        if (typeof v === 'object' && v !== obj) {
          const nested = await extractText(v, depth + 1);
          if (nested) return nested;
        }
      }
    } catch (e) {
      console.warn('[attemptGenerate] error iterando keys:', getErrorMessage(e));
    }
    return null;
  }
  const text = await extractText(result);
  if (text && text.trim().length > 0) {
    return text;
  }
  try {
    return JSON.stringify(result);
  } catch (e) {
    return String(result);
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const masterPrompt = `
Actúa como un analista de medios experto, neutral y objetivo. Tu tarea es analizar el siguiente contenido (que será una URL y un texto extraído de una página web) y devolver SOLAMENTE un objeto JSON válido con la siguiente estructura:
{
  "source": { "type": "string", "bias": "string", "reputation": "string" },
  "alerts": [{ "id": number, "type": "string", "text": "string" }],
  "context": "string",
  "questions": [{ "id": number, "text": "string" }]
}

Sigue estas instrucciones para cada campo:
1.  **source.type**: Identifica el tipo de fuente basándote en la URL (Ej: "Medio de Noticias Oficial", "Blog de Opinión", "Red Social", "Foro anónimo").
2.  **source.bias**: Describe el sesgo ideológico conocido de la fuente de la forma más neutral posible (Ej: "Centro-izquierda", "Conservador", "Libertario", "No aplica").
3.  **source.reputation**: Resume la reputación general de la fuente en una frase (Ej: "Generalmente confiable, con historial de verificación de hechos.", "Conocido por publicar contenido sensacionalista.").
4.  **alerts**: Crea un array de objetos. Busca y añade una alerta para cada uno de estos casos que encuentres en el texto:
    - **sensationalism**: Si el titular o el texto usa lenguaje excesivamente emocional, alarmista o exagerado.
    - **unsourced_claim**: Si se presenta una estadística, cifra o afirmación importante sin citar una fuente clara.
    - **inconsistency**: Si encuentras contradicciones lógicas o de datos dentro del propio texto.
    Si no encuentras alertas, devuelve un array vacío [].
5.  **context**: Proporciona un resumen breve y neutral (2-3 frases) del contexto general del tema, basándote en conocimiento establecido y evitando opiniones.
6.  **questions**: Genera exactamente 3 preguntas críticas y abiertas que un lector debería hacerse para evaluar mejor el contenido por su cuenta.

No añadas comentarios, explicaciones ni ningún texto fuera del objeto JSON.

Contenido a analizar:
---
{{CONTENT}}
---
`;

/* ------------------ ROUTES ------------------ */
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = (await request.json()) as Partial<{ content?: string; url?: string; title?: string }>;
    let content = typeof body.content === 'string' ? body.content : '';
    let url = typeof body.url === 'string' ? body.url : undefined;
    let title = typeof body.title === 'string' ? body.title : '';

    if (!content || isLikelyUISnippet(content)) {
      console.info('[verify] input looks like UI or empty -> trying server-side extraction');
      if (!url) {
        throw new HttpError('El contenido no es un artículo y no se proporcionó URL.', 422);
      }
      const article = await extractArticleServerSide(url);
      if (!article || !article.content) {
        throw new HttpError('No se pudo extraer artículo desde la URL proporcionada.', 422);
      }
      content = article.content;
      title = article.title ?? title;
    }

    content = sanitizePII(content);
    const MAX_CHARS = 40_000;
    if (content.length > MAX_CHARS) content = content.slice(0, MAX_CHARS) + '\n\n...[CONTENIDO TRUNCADO]';

    const promptWithContent = masterPrompt.replace('{{CONTENT}}', content);

    if (isCircuitOpen(PRIMARY_MODEL)) {
      throw new HttpError('El servicio de IA está temporalmente saturado. Intenta más tarde.', 503);
    }
    let jsonText: string;
    try {
      jsonText = await attemptGenerate(PRIMARY_MODEL, promptWithContent);
      recordCircuitSuccess(PRIMARY_MODEL);
    } catch (primaryError: any) {
      console.error('[verify] primary model failed:', primaryError?.message ?? primaryError);
      recordCircuitFailure(PRIMARY_MODEL);
      try {
        console.info('[verify] trying fallback model', FALLBACK_MODEL);
        jsonText = await attemptGenerate(FALLBACK_MODEL, promptWithContent);
        recordCircuitSuccess(PRIMARY_MODEL);
      } catch (fallbackError: any) {
        console.error('[verify] fallback failed:', fallbackError?.message ?? fallbackError);
        throw new HttpError('Servicio de IA no disponible. Intenta más tarde.', 503);
      }
    }

    const cleanedJsonText = String(jsonText).replace(/```json/g, '').replace(/```/g, '').trim();
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(cleanedJsonText);
    } catch (err: any) {
      console.error('[verify] JSON parse failed:', err?.message ?? err);
      throw new HttpError('La respuesta de la IA no era JSON válido.', 502);
    }

    const validation = AnalysisSchema.safeParse(parsedJson);
    if (!validation.success) {
      console.error('[verify] schema validation failed:', validation.error.format());
      throw new HttpError('La respuesta de la IA no cumple el esquema esperado.', 502);
    }
    const analysisResult = validation.data;

    if (session?.user?.id) {
      try {
        await prisma.verification.create({
          data: { userId: session.user.id, url: url ?? null, title: title ?? null, analysis: analysisResult as any },
        });
        console.info(`[verify] saved verification for user ${session.user.id}`);
      } catch (dbErr) {
        console.warn('[verify] DB save failed (non-fatal):', dbErr);
      }
    }

    return new NextResponse(JSON.stringify(analysisResult), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    if (err instanceof HttpError) {
      return new NextResponse(JSON.stringify({ error: err.message }), { status: err.status, headers: corsHeaders });
    }
    console.error('[verify] unexpected error:', err);
    return new NextResponse(JSON.stringify({ error: 'Ocurrió un error interno en el servidor.' }), { status: 500, headers: corsHeaders });
  }
}