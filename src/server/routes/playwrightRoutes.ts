import { Router, Request, Response } from 'express';
import { db } from '../db/index';
import { executePlaywrightTest, executeJobScraper } from '../services/playwrightRunner';
import { playwrightMentorAdvice } from '../services/geminiService';

const router = Router();

// GET all code snippets
router.get('/snippets', (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM playwright_snippets WHERE 1=1';
    const params: any[] = [];

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (title LIKE ? OR code LIKE ? OR tags LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY id ASC';
    const snippets = db.prepare(query).all(...params);
    res.json(snippets);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST add new snippet
router.post('/snippets', (req: Request, res: Response) => {
  try {
    const { title, category, code, explanation, tags } = req.body;
    const stmt = db.prepare(`
      INSERT INTO playwright_snippets (title, category, code, explanation, tags)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(title, category, code, explanation || '', tags || '');
    const created = db.prepare('SELECT * FROM playwright_snippets WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update existing snippet
router.put('/snippets/:id', (req: Request, res: Response) => {
  try {
    const { title, category, code, explanation, tags } = req.body;
    const stmt = db.prepare(`
      UPDATE playwright_snippets
      SET title = ?, category = ?, code = ?, explanation = ?, tags = ?
      WHERE id = ?
    `);
    stmt.run(title, category, code, explanation || '', tags || '', req.params.id);
    const updated = db.prepare('SELECT * FROM playwright_snippets WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE snippet
router.delete('/snippets/:id', (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM playwright_snippets WHERE id = ?').run(req.params.id);
    res.json({ success: true, deletedId: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST run Playwright test
router.post('/run-test', async (req: Request, res: Response) => {
  try {
    const { testPath } = req.body;
    const result = await executePlaywrightTest(testPath || 'tests/sandbox/challenge.spec.ts');

    // Save run record to automation_runs
    db.prepare(`
      INSERT INTO automation_runs (script_name, parameters, status, output_summary, duration_ms)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      testPath || 'All Sandbox Tests',
      JSON.stringify({ testPath }),
      result.success ? 'SUCCESS' : 'FAILED',
      result.output.slice(0, 1000),
      result.durationMs
    );

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST run Berlin job scraper
router.post('/run-scraper', async (req: Request, res: Response) => {
  try {
    const { keyword, location } = req.body;
    const result = await executeJobScraper(keyword || 'QA Automation Engineer', location || 'Berlin');

    // Record automation run
    db.prepare(`
      INSERT INTO automation_runs (script_name, parameters, status, output_summary, duration_ms)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      'Berlin Job Scraper',
      JSON.stringify({ keyword, location }),
      result.success ? 'SUCCESS' : 'FAILED',
      `Found ${result.jobs.length} jobs in ${location || 'Berlin'}`,
      1200
    );

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Playwright AI Mentor advice
router.post('/mentor', async (req: Request, res: Response) => {
  try {
    const { mode, input } = req.body;
    const advice = await playwrightMentorAdvice(mode || 'locator', input || '');
    res.json(advice);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET recent test / automation runs
router.get('/runs', (req: Request, res: Response) => {
  try {
    const runs = db.prepare('SELECT * FROM automation_runs ORDER BY created_at DESC LIMIT 20').all();
    res.json(runs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
