import { Express } from 'express';
import { registerAuthRoutes } from './auth';
import { registerAdminRoutes } from './admin';
import { registerCBTRoutes } from './cbt';
import { registerDebugRoutes } from './debug';
import { registerAttendanceRoutes } from './attendance';

export const registerRoutes = async (app: Express) => {
  // Register all domain-specific routes
  registerAuthRoutes(app);
  registerAdminRoutes(app);
  registerCBTRoutes(app);
  registerDebugRoutes(app);
  registerAttendanceRoutes(app);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  return app;
};