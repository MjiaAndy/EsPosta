// lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  throw new Error("La variable de entorno GOOGLE_API_KEY no está definida.");
}

export const genAI = new GoogleGenerativeAI(apiKey);

export async function generateTextFromModel(
  modelName: string,
  prompt: string,
  opts?: { temperature?: number; maxOutputTokens?: number }
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error(`Error al generar contenido con el modelo ${modelName}:`, error);
    throw error;
  }
}