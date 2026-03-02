import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
    console.log(`[SYS] ${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

// Offline Mock Mode Interceptor
app.use('/api', (req, res, next) => {
    if (process.env.MOCK_DB === 'true') {
        if (req.path === '/auth/login' || req.path === '/auth/register') {
            return res.json({ token: 'mock-jwt-token', user: { id: 1, username: req.body?.email || req.body?.username || 'AgentZero', role: 'admin' } });
        }
        if (req.path === '/dashboard/stats') {
            return res.json({ success: true, data: { activeThreats: 12, promptsAnalyzed: 14050, systemLoad: 42 } });
        }
        if (req.path.includes('/analyses')) {
            if (req.method === 'GET') return res.json({ success: true, data: [] });
            if (req.method === 'POST') return res.json({ success: true, data: { id: 999, ...req.body, level: 'safe', score: 10 } });
        }
    }
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/analyses', analysisRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/health', (req, res) => res.json({ status: 'ALL SYSTEMS OPERATIONAL' }));

app.use(errorHandler);

export default app;
