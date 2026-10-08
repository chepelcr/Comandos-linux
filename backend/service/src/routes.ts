import { labRouter } from './labs/routes';
import type { Express } from 'express';
import { progressController } from './dependency_injection';
export function setupRoutes(app:Express){app.use('/me',progressController.getRouter());app.use('/labs',labRouter);}
