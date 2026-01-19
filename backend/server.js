import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query, closePool } from './db/connection.js';
import usersRouter from './routes/users.js';
import brdsRouter from './routes/brds.js';
import alertsRouter from './routes/alerts.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// API Routes
app.use('/api/users', usersRouter);
app.use('/api/brds', brdsRouter);
app.use('/api/alerts', alertsRouter);

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down...');
  await closePool();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 BRD Backend Server running!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   URL: http://localhost:${PORT}
   API: http://localhost:${PORT}/api
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Endpoints:
   • GET  /api/health      - Health check
   • /api/users            - User management
   • /api/brds             - BRD management  
   • /api/alerts           - Alerts/Notifications
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

export default app;
