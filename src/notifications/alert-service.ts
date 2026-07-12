/**
 * Enterprise Notification alert dispatcher.
 * Forwards key events (new leads, bookings, payments) to team Slack channels.
 */
export class AlertService {
  /**
   * Dispatches an external Slack webhook message.
   */
  public static async sendSlackAlert(webhookUrl: string | undefined, message: string): Promise<boolean> {
    if (!webhookUrl) {
      console.log(`[ALERT SIMULATOR] Notification: "${message}"`);
      return true;
    }

    try {
      console.log(`[ALERT HANDLER] Dispatching team Slack alert...`);
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🔔 *SalesPilot Workspace Alert*:\n${message}`,
          mrkdwn: true
        })
      });
      return response.ok;
    } catch (err) {
      console.error('[ALERT EXCEPTION] Failed to dispatch Slack message:', err);
      return false;
    }
  }
}
