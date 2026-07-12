import { GoogleGenAI } from '@google/genai';

/**
 * Enterprise AI helper client using GoogleGenAI.
 * Configured with resilient try/catch checks.
 */
export class GeminiService {
  private static aiInstance: any = null;

  public static getClient(apiKey?: string): any {
    if (!apiKey) {
      return null;
    }
    if (!this.aiInstance) {
      this.aiInstance = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'salespilot-enterprise' } }
      });
    }
    return this.aiInstance;
  }

  /**
   * Safe structured text analyzer.
   */
  public static async generateContentSafely(
    apiKey: string | undefined, 
    prompt: string, 
    fallbackData: any
  ): Promise<any> {
    const client = this.getClient(apiKey);
    if (!client) {
      console.log('[AI OFFLINE] API Key missing. Returning pre-baked structure fallback.');
      return fallbackData;
    }

    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });
      const text = response.text || '';
      return JSON.parse(text);
    } catch (err) {
      console.error('[AI EXCEPTION] Failed to query Gemini. Using robust fallback:', err);
      return fallbackData;
    }
  }
}
