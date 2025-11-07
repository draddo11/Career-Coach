
import { GoogleGenAI } from '@google/genai';

let ai: GoogleGenAI | null = null;

/**
 * Initializes and returns a singleton instance of the GoogleGenAI client.
 * Throws an error if the API_KEY is not available in the environment.
 */
export const getAiClient = (): GoogleGenAI => {
    if (!process.env.API_KEY) {
        // This is a client-side check. The API key is expected to be in the environment.
        throw new Error("API_KEY is not available. This feature requires direct client-side access to the Gemini API.");
    }
    if (!ai) {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};