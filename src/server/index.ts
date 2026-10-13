import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { initDatabase } from './db/index';
import jobRoutes from './routes/jobRoutes';
import germanRoutes from './routes/germanRoutes';
import playwrightRoutes from './routes/playwrightRoutes';
import sandboxRoutes from './routes/sandboxRoutes';

dotenv.config();

// Initialize Database & Seed data
initDatabase();

// Load persistent Gemini API Key if saved in database
import { setGeminiApiKey } from './services/geminiService';
import { db } from './db/index';
const savedKey = db.prepare('SELECT value FROM user_settings WHERE key = ?').get('gemini_api_key') as { value: string } | undefined;
if (savedKey?.value) {
  setGeminiApiKey(savedKey.value);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static assets (test screenshots and traces)
app.use('/test-results', express.static(path.resolve(process.cwd(), 'test-results')));

// Mount API routes
app.use('/api/jobs', jobRoutes);
app.use('/api/german', germanRoutes);
app.use('/api/playwright', playwrightRoutes);
app.use('/sandbox', sandboxRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    modules: ['job-hunting', 'german-learning', 'playwright-lab']
  });
});

// Serve frontend in production
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/sandbox')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`[PersonalApp] Server successfully running at http://localhost:${PORT}`);
  console.log(`[PersonalApp] Sandbox targets active at http://localhost:${PORT}/sandbox`);
});

export default app;
