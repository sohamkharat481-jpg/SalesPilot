/**
 * Server Initialization Core
 * Manages standard process signaling and cluster stubs.
 */
export class ServerCore {
  public static validateEnvironment(requiredVars: string[]): void {
    const missing = requiredVars.filter(v => !process.env[v]);
    if (missing.length > 0) {
      console.warn(`[SERVER WARNING] Missing recommended environment configurations: ${missing.join(', ')}`);
    } else {
      console.log('[SERVER OK] All enterprise environment descriptors satisfied.');
    }
  }

  public static handleTermination(cleanupFn: () => Promise<void>): void {
    const handleSig = async (signal: string) => {
      console.log(`[SERVER] Received ${signal}. Initiating graceful shutdown sequence...`);
      try {
        await cleanupFn();
        console.log('[SERVER] Graceful shutdown completed safely. Exiting process.');
        process.exit(0);
      } catch (err) {
        console.error('[SERVER ERROR] Failed to terminate connections gracefully:', err);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => handleSig('SIGTERM'));
    process.on('SIGINT', () => handleSig('SIGINT'));
  }
}
