import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import cropRoutes from './routes/crops';
import orderRoutes from './routes/orders';
import negotiationRoutes from './routes/negotiations';
import aiRoutes from './routes/ai';
import inventoryRoutes from './routes/inventory';
import weatherRoutes from './routes/weather';
import geocodeRoutes from './routes/geocode';
import marketPriceRoutes from './routes/marketPrices';
import cropEncyclopediaRoutes from './routes/cropEncyclopedia';
import financialRoutes from './routes/financial';
import uploadRoutes from './routes/upload';
import userRoutes from './routes/user';
import feedbackRoutes from './routes/feedback';
import { getHomeInfo } from './controllers/homeController';
import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();
const corsOptions = {
  // Allow your Netlify URL
  origin: 'https://agirivisiion.netlify.app', 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Allow cookies/headers if needed
  optionsSuccessStatus: 204
};
// ─── Security & Parsing ───────────────────────────────────────────────────────
app.use(
  helmet({
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
          'http://localhost:3000',
          'https://agirivisiion.netlify.app',
          process.env.CLIENT_URL || '',
          'https://*.amazonaws.com', // Allow S3 connections
        ],
      },
    },
  })
);

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || '',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'https://agirivisiion.netlify.app',
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus :204
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ─── Static uploads ───────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Home Route ───────────────────────────────────────────────────────────────
app.get('/', getHomeInfo);

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
app.use('/api/auth', authRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/negotiations', negotiationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/market-prices', marketPriceRoutes);
app.use('/api/crop-encyclopedia', cropEncyclopediaRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/user', userRoutes);
app.use('/api/feedback', feedbackRoutes);

// ─── 404 & Error Handler ──────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
