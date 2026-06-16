import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initDb } from './database/db.js';

import authRouter from './routes/auth.js';
import toolsRouter from './routes/tools.js';
import newsRouter from './routes/news.js';
import eventsRouter from './routes/events.js';
import assistantRouter from './routes/assistant.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Standard Vite ports
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});
app.use('/api', apiLimiter);

// Specific stricter limiter for login and AI assistant
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Strict limit for logins/assistant queries
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' }
});
app.use('/api/auth/login', loginLimiter);
app.use('/api/assistant', loginLimiter);

app.use(express.json());

// Bind API Routes
app.use('/api/auth', authRouter);
app.use('/api/tools', toolsRouter);
app.use('/api/news', newsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/assistant', assistantRouter);

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error occurred' });
});

// Database Initialization and Server Startup
async function startServer() {
  try {
    await initDb();
    console.log('Database initialized successfully.');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize database or start server:', error);
    process.exit(1);
  }
}

startServer();
