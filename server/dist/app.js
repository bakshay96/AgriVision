"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const auth_1 = __importDefault(require("./routes/auth"));
const crops_1 = __importDefault(require("./routes/crops"));
const orders_1 = __importDefault(require("./routes/orders"));
const ai_1 = __importDefault(require("./routes/ai"));
const inventory_1 = __importDefault(require("./routes/inventory"));
const weather_1 = __importDefault(require("./routes/weather"));
const marketPrices_1 = __importDefault(require("./routes/marketPrices"));
const cropEncyclopedia_1 = __importDefault(require("./routes/cropEncyclopedia"));
const financial_1 = __importDefault(require("./routes/financial"));
const upload_1 = __importDefault(require("./routes/upload"));
const user_1 = __importDefault(require("./routes/user"));
const homeController_1 = require("./controllers/homeController");
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
// ─── Security & Parsing ───────────────────────────────────────────────────────
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: [
                "'self'",
                'data:',
                'blob:',
                'https://*.googleapis.com',
                'https://images.unsplash.com',
                'https://*.amazonaws.com', // Allow S3 images
            ],
            connectSrc: [
                "'self'",
                process.env.CLIENT_URL || 'http://localhost:3000',
                'https://*.amazonaws.com', // Allow S3 connections
            ],
        },
    },
}));
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}
// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = (0, express_rate_limit_1.default)({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    message: { success: false, message: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);
// ─── Static uploads ───────────────────────────────────────────────────────────
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// ─── Home Route ───────────────────────────────────────────────────────────────
app.get('/', homeController_1.getHomeInfo);
// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'AgriVision Pro API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
});
// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', auth_1.default);
app.use('/api/crops', crops_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/ai', ai_1.default);
app.use('/api/inventory', inventory_1.default);
app.use('/api/weather', weather_1.default);
app.use('/api/market-prices', marketPrices_1.default);
app.use('/api/crop-encyclopedia', cropEncyclopedia_1.default);
app.use('/api/financial', financial_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api/user', user_1.default);
// ─── 404 & Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map