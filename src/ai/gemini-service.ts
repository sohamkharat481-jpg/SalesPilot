import { GoogleGenAI } from '@google/genai';

/**
 * Enterprise AI helper client using GoogleGenAI.
 * Configured with resilient try/catch checks and fallback execution.
 */
export class GeminiService {
  private static aiInstance: any = null;

  public static getClient(apiKey?: string): any {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      return null;
    }
    if (!this.aiInstance) {
      this.aiInstance = new GoogleGenAI({
        apiKey: key,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
    }
    return this.aiInstance;
  }

  /**
   * Safe structured text analyzer using gemini-3.6-flash.
   */
  public static async generateContentSafely(
    apiKey: string | undefined, 
    prompt: string, 
    fallbackData: any
  ): Promise<any> {
    const client = this.getClient(apiKey);
    if (!client) {
      console.log('[AI OFFLINE] API Key missing. Returning structured fallback.');
      return fallbackData;
    }

    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });
      const text = response.text || '';
      return JSON.parse(text);
    } catch (err) {
      console.error('[AI EXCEPTION] Failed to query Gemini 3.6 Flash:', err);
      return fallbackData;
    }
  }

  /**
   * Safe text generation helper.
   */
  public static async generateTextSafely(
    apiKey: string | undefined,
    prompt: string,
    fallbackText: string
  ): Promise<string> {
    const client = this.getClient(apiKey);
    if (!client) {
      return fallbackText;
    }

    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt
      });
      return response.text || fallbackText;
    } catch (err) {
      console.error('[AI EXCEPTION] Failed to query Gemini 3.6 Flash text:', err);
      return fallbackText;
    }
  }
}

