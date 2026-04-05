"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const database_1 = __importDefault(require("./config/database"));
const socketService_1 = require("./services/socketService");
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    // Connect to MongoDB
    await (0, database_1.default)();
    // Create HTTP server
    const httpServer = http_1.default.createServer(app_1.default);
    // Initialize Socket.io
    (0, socketService_1.initSocketService)(httpServer);
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
    const shutdown = async (signal) => {
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
//# sourceMappingURL=server.js.map