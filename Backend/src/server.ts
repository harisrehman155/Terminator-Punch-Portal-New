import dotenv from 'dotenv';
import app from './app';
import logger from './utils/logger';
import { initializeDatabase } from './database/connection';

// Load environment variables
dotenv.config();

// Initialize database connection and lookup cache on startup
initializeDatabase().catch((error) => {
  logger.error('Failed to initialize database:', error);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`
    ╔═══════════════════════════════════════╗
    ║   TP Portal Backend Server Started   ║
    ╚═══════════════════════════════════════╝

    🚀 Server running on port: ${PORT}
    🌍 Environment: ${process.env.NODE_ENV || 'development'}
    📡 API URL: http://localhost:${PORT}
    🔗 Health Check: http://localhost:${PORT}/health

    Ready to accept requests...
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default server;
