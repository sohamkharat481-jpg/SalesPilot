import crypto from 'crypto';

/**
 * Enterprise Cashfree PG Client Wrapper.
 */
export class CashfreeClient {
  /**
   * Generates signature payload for order verification.
   */
  public static verifyWebhookSignature(
    signature: string, 
    rawBody: string, 
    secretKey: string
  ): boolean {
    if (!signature || !secretKey) return false;
    
    try {
      const computed = crypto
        .createHmac('sha256', secretKey)
        .update(rawBody)
        .digest('base64');
      return computed === signature;
    } catch (err) {
      console.error('[PAYMENT EXCEPTION] Webhook signature calculation failed:', err);
      return false;
    }
  }

  /**
   * Formats sandbox vs production gateway routes.
   */
  public static getEndpoint(isProduction: boolean): string {
    return isProduction 
      ? 'https://api.cashfree.com/pg/orders' 
      : 'https://sandbox.cashfree.com/pg/orders';
  }
}
// Note: Since this is executed server-side under Node and Vite-build processes,
// standard crypto modules are cleanly imported.
