import { Router, Request, Response } from 'express';
import { db } from '../db/index';
import { explainGermanGrammar, gradeGoetheWriting } from '../services/geminiService';
import fs from 'fs';
import path from 'path';

const router = Router();

// GET all German Alphabets, Umlaute, and Phonics rules
router.get('/alphabets', (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM german_alphabets WHERE 1=1';
    const params: any[] = [];

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY id ASC';
    const items = db.prepare(query).all(...params);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET vocabulary items
router.get('/vocab', (req: Request, res: Response) => {
  try {
    const { level, category, search } = req.query;
    let query = 'SELECT * FROM german_vocab WHERE 1=1';
    const params: any[] = [];

    if (level && level !== 'all') {
      query += ' AND cefr_level = ?';
      params.push(level);
    }
    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (german LIKE ? OR english LIKE ? OR gujarati LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY id ASC';
    const items = db.prepare(query).all(...params);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST add new vocab word
router.post('/vocab', (req: Request, res: Response) => {
  try {
    const { german, article, plural, english, gujarati, cefr_level, category, example_sentence } = req.body;
    const stmt = db.prepare(`
      INSERT INTO german_vocab (german, article, plural, english, gujarati, cefr_level, category, example_sentence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      german,
      article || '',
      plural || '',
      english,
      gujarati || '',
      cefr_level || 'A1',
      category || 'General',
      example_sentence || ''
    );
    const created = db.prepare('SELECT * FROM german_vocab WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST update vocab SRS review
router.post('/vocab/:id/review', (req: Request, res: Response) => {
  try {
    const { rating } = req.body; // 'again', 'hard', 'good', 'easy'
    const item = db.prepare('SELECT * FROM german_vocab WHERE id = ?').get(req.params.id) as any;
    if (!item) return res.status(404).json({ error: 'Vocab item not found' });

    let newLevel = item.srs_level || 0;
    let daysToAdd = 1;

    if (rating === 'again') {
      newLevel = 0;
      daysToAdd = 0.5;
    } else if (rating === 'hard') {
      newLevel = Math.max(0, newLevel);
      daysToAdd = 1;
    } else if (rating === 'good') {
      newLevel += 1;
      daysToAdd = Math.pow(2, newLevel);
    } else if (rating === 'easy') {
      newLevel += 2;
      daysToAdd = Math.pow(3, newLevel);
    }

    const nextReview = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();
    db.prepare('UPDATE german_vocab SET srs_level = ?, next_review_at = ? WHERE id = ?').run(newLevel, nextReview, item.id);

    res.json({ success: true, srs_level: newLevel, next_review_at: nextReview });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Error Log entries
router.get('/error-log', (req: Request, res: Response) => {
  try {
    const items = db.prepare('SELECT * FROM german_error_log ORDER BY created_at DESC').all();
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST add Error Log entry
router.post('/error-log', async (req: Request, res: Response) => {
  try {
    const { wrong_sentence, corrected_sentence, grammar_rule, explanation_en, explanation_gu } = req.body;

    let finalEn = explanation_en;
    let finalGu = explanation_gu;

    if (!finalEn) {
      finalEn = await explainGermanGrammar(grammar_rule, 'en');
    }
    if (!finalGu) {
      finalGu = await explainGermanGrammar(grammar_rule, 'gu');
    }

    const stmt = db.prepare(`
      INSERT INTO german_error_log (
        wrong_sentence, corrected_sentence, grammar_rule, explanation_en, explanation_gu, srs_level, next_review_at
      ) VALUES (?, ?, ?, ?, ?, 0, ?)
    `);

    const nextReview = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const result = stmt.run(wrong_sentence, corrected_sentence, grammar_rule, finalEn, finalGu, nextReview);
    const created = db.prepare('SELECT * FROM german_error_log WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST update Error Log SRS review
router.post('/error-log/:id/review', (req: Request, res: Response) => {
  try {
    const { rating } = req.body; // 'again', 'good'
    const item = db.prepare('SELECT * FROM german_error_log WHERE id = ?').get(req.params.id) as any;
    if (!item) return res.status(404).json({ error: 'Item not found' });

    let newLevel = item.srs_level || 0;
    if (rating === 'good') newLevel += 1;
    else newLevel = 0;

    const daysToAdd = newLevel === 0 ? 1 : Math.pow(2, newLevel);
    const nextReview = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();
    db.prepare('UPDATE german_error_log SET srs_level = ?, next_review_at = ? WHERE id = ?').run(newLevel, nextReview, item.id);

    res.json({ success: true, srs_level: newLevel, next_review_at: nextReview });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST explain grammar concept in English or Gujarati
router.post('/explain', async (req: Request, res: Response) => {
  try {
    const { concept, language } = req.body;
    const explanation = await explainGermanGrammar(concept || 'V2 word order', (language === 'gu' ? 'gu' : 'en'));
    res.json({ concept, language, explanation });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST grade Goethe B1 mock writing
router.post('/grade-exam', async (req: Request, res: Response) => {
  try {
    const { topic, submission } = req.body;
    const evaluation = await gradeGoetheWriting(topic, submission);

    db.prepare(`
      INSERT INTO german_mock_exams (exam_type, section, user_submission, score, feedback)
      VALUES ('Goethe B1', 'Schreiben', ?, ?, ?)
    `).run(submission, evaluation.score, JSON.stringify(evaluation));

    res.json(evaluation);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET scanned reference textbook files in reference_materials/textbook/
router.get('/textbook-files', (req: Request, res: Response) => {
  try {
    const textbookDir = path.resolve(process.cwd(), 'reference_materials', 'textbook');
    const files: Array<{ name: string; size: number; path: string }> = [];

    if (fs.existsSync(textbookDir)) {
      const list = fs.readdirSync(textbookDir);
      for (const item of list) {
        const full = path.join(textbookDir, item);
        const stat = fs.statSync(full);
        if (stat.isFile()) {
          files.push({ name: item, size: stat.size, path: full });
        }
      }
    }

    res.json({
      folderPath: textbookDir,
      files
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
