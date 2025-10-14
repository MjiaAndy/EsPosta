import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) throw new Error('La variable de entorno GOOGLE_API_KEY no está definida.');

export const genAI = new GoogleGenerativeAI(apiKey);

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try { return typeof err === 'string' ? err : JSON.stringify(err); } catch { return String(err); }
}

type AnyFunction = (...args: unknown[]) => unknown;
function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}

export async function generateTextFromModel(modelName: string, prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result: unknown = await model.generateContent(prompt);

    async function extractText(obj: unknown, depth = 0): Promise<string | null> {
      if (obj == null) return null;
      if (typeof obj === 'string' && obj.trim()) return obj;
      if (depth > 6) return null;

      if (isRecord(obj)) {
        const maybeText = obj['text'];
        if (typeof maybeText === 'function') {
          try {
            const val = (maybeText as AnyFunction).call(obj);
            const awaited = val instanceof Promise ? await val : val;
            if (typeof awaited === 'string' && awaited.trim()) return awaited;
            if (awaited != null) return String(awaited);
          } catch {
          }
        }

        const keysCandidates = ['response', 'output', 'candidates', 'content', 'results', 'choices'];
        for (const k of keysCandidates) {
          if (k in obj) {
            const child = obj[k];
            if (Array.isArray(child)) {
              for (const it of child) {
                const found = await extractText(it, depth + 1);
                if (found) return found;
              }
            } else {
              const found = await extractText(child, depth + 1);
              if (found) return found;
            }
          }
        }

        for (const k of Object.keys(obj)) {
          const v = obj[k];
          if (typeof v === 'string' && v.trim()) return v;
          const nested = await extractText(v, depth + 1);
          if (nested) return nested;
        }
      }
      return null;
    }

    const text = await extractText(result);
    if (text) return text;
    return typeof result === 'string' ? result : JSON.stringify(result);
  } catch (err: unknown) {
    console.error(`Error al generar contenido con modelo ${modelName}:`, getErrorMessage(err));
    throw err;
  }
}
