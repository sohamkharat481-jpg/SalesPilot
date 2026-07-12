/**
 * Enterprise Workflows Service
 * Manages secure outbound webhook notifications to n8n pipelines.
 */
export class WorkflowService {
  /**
   * Dispatches a webhook trigger payload to the configured n8n system.
   */
  public static async dispatchEvent(webhookUrl: string | undefined, eventName: string, payload: any): Promise<boolean> {
    if (!webhookUrl) {
      console.log(`[AUTOMATION SIMULATOR] Event "${eventName}" logged. Webhook target unconfigured.`);
      return true;
    }

    try {
      console.log(`[AUTOMATION DISPATCH] Sending event "${eventName}" to n8n webhook: ${webhookUrl}...`);
      
      // Real fetch POST request payload
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SalesPilot-Event': eventName
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          event: eventName,
          data: payload
        })
      });

      console.log(`[AUTOMATION DISPATCH] Dispatch returned status: ${response.status}`);
      return response.ok;
    } catch (err) {
      console.error(`[AUTOMATION HANDLER ERROR] Webhook failed to fire:`, err);
      return false;
    }
  }
}
