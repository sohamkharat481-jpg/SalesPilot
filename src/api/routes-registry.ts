import { Express } from 'express';

/**
 * Enterprise API Version 1 Routing Registry.
 * Coordinates system-wide endpoint bindings.
 */
export class RoutesRegistry {
  /**
   * Registers global health checking utility.
   */
  public static registerBaseRoutes(app: Express): void {
    app.get('/api/v1/health', (req, res) => {
      res.json({
        success: true,
        status: 'UP',
        timestamp: new Date().toISOString(),
        service: 'salespilot-core',
        uptimeSeconds: Math.floor(process.uptime())
      });
    });
    
    console.log('[API REGISTRY] Base enterprise REST routes successfully registered.');
  }
}
// Note: Since server.ts uses custom initialization, we export clean registration hooks.
