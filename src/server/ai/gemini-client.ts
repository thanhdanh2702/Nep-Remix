import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
  console.warn('[Gemini] GEMINI_API_KEY missing: AI routes will return fallbacks. Set it in .env or the host environment.');
}

/**
 * Shared Gemini client instance configured exclusively on the server side.
 * Never exposed to browser or client bundles.
 */
export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});
