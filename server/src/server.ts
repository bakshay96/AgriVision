import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import connectDB from './config/database';
import { initSocketService } from './services/socketService';

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  // Connect to MongoDB
  await connectDB();

  // Create HTTP server
  const httpServer = http.createServer(app);

  // Initialize Socket.io
  initSocketService(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║          AgriVision Pro API Server            ║
║    Environment : ${(process.env.NODE_ENV || 'development').padEnd(26)}║
║    Port        : ${String(PORT).padEnd(26)}║
║    Status      : Running                      ║
╚═══════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n[Server] ${signal} received. Gracefully shutting down...`);
    httpServer.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
