import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth.routes';
import lookupRoutes from './routes/lookup.routes';
import orderRoutes from './routes/order.routes';
import quoteRoutes from './routes/quote.routes';
import adminRoutes from './routes/admin.routes';
import fileRoutes from './routes/file.routes';
// import userRoutes from './routes/user.routes';

import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'TP Portal API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/lookups', lookupRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/files', fileRoutes);
// app.use('/api/user', userRoutes);

// 404 handler
app.use('*', notFoundHandler);

// Error handling middleware (should be last)
app.use(errorHandler);

export default app;
