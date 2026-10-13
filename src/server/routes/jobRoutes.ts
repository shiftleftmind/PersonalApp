import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { db } from '../db/index';
import { analyzeJobPosting, generateTailoredCoverLetter, setGeminiApiKey, pingGemini } from '../services/geminiService';
import { createCoverLetterPDF } from '../services/pdfService';

const router = Router();

// GET all job applications with search and filters
router.get('/', (req: Request, res: Response) => {
  try {
    const { search, stage, location } = req.query;
    let query = 'SELECT * FROM job_applications WHERE 1=1';
    const params: any[] = [];

    if (stage && stage !== 'all') {
      query += ' AND stage = ?';
      params.push(stage);
    }
    if (location) {
      query += ' AND location LIKE ?';
      params.push(`%${location}%`);
    }
    if (search) {
      query += ' AND (company LIKE ? OR title LIKE ? OR tech_stack LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';
    const jobs = db.prepare(query).all(...params);

    // Calculate follow-up flags (e.g. applied > 7 days ago with no updates)
    const enrichedJobs = jobs.map((job: any) => {
      let needsFollowUp = false;
      if (job.applied_at && job.stage === 'Applied') {
        const appliedDate = new Date(job.applied_at).getTime();
        const daysPassed = (Date.now() - appliedDate) / (1000 * 60 * 60 * 24);
        if (daysPassed >= 7) {
          needsFollowUp = true;
        }
      }
      return { ...job, needsFollowUp };
    });

    res.json(enrichedJobs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET single job with its cover letters
router.get('/:id', (req: Request, res: Response) => {
  try {
    const job = db.prepare('SELECT * FROM job_applications WHERE id = ?').get(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job application not found' });
    }
    const coverLetters = db.prepare('SELECT * FROM cover_letters WHERE job_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json({ ...job, coverLetters });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create job application
router.post('/', (req: Request, res: Response) => {
  try {
    const {
      company,
      title,
      location,
      salary_range,
      url,
      stage,
      german_level_required,
      match_score,
      match_analysis,
      company_background,
      tech_stack,
      notes,
      applied_at
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO job_applications (
        company, title, location, salary_range, url, stage,
        german_level_required, match_score, match_analysis,
        company_background, tech_stack, notes, applied_at, last_contact_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    const result = stmt.run(
      company || 'Unknown Company',
      title || 'Software Test Engineer',
      location || 'Berlin',
      salary_range || '',
      url || '',
      stage || 'Wishlist',
      german_level_required || 'B1',
      match_score || 0,
      typeof match_analysis === 'object' ? JSON.stringify(match_analysis) : match_analysis || '',
      company_background || '',
      tech_stack || '',
      notes || '',
      applied_at || (stage === 'Applied' ? new Date().toISOString() : null),
      new Date().toISOString()
    );

    const createdJob = db.prepare('SELECT * FROM job_applications WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(createdJob);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update job application
router.put('/:id', (req: Request, res: Response) => {
  try {
    const {
      company,
      title,
      location,
      salary_range,
      url,
      stage,
      german_level_required,
      match_score,
      notes,
      applied_at
    } = req.body;

    db.prepare(`
      UPDATE job_applications SET
        company = COALESCE(?, company),
        title = COALESCE(?, title),
        location = COALESCE(?, location),
        salary_range = COALESCE(?, salary_range),
        url = COALESCE(?, url),
        stage = COALESCE(?, stage),
        german_level_required = COALESCE(?, german_level_required),
        match_score = COALESCE(?, match_score),
        notes = COALESCE(?, notes),
        applied_at = COALESCE(?, applied_at),
        last_contact_at = ?
      WHERE id = ?
    `).run(
      company, title, location, salary_range, url, stage,
      german_level_required, match_score, notes, applied_at,
      new Date().toISOString(),
      req.params.id
    );

    const updatedJob = db.prepare('SELECT * FROM job_applications WHERE id = ?').get(req.params.id);
    res.json(updatedJob);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE job application
router.delete('/:id', (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM job_applications WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Deleted application' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST extract job details via Gemini Multimodal with live URL fetching
router.post('/extract', async (req: Request, res: Response) => {
  try {
    const { text, imageBase64, mimeType } = req.body;
    let processedText = text || '';

    // If the input is a web URL, fetch the HTML text
    if (processedText.startsWith('http://') || processedText.startsWith('https://')) {
      try {
        const response = await fetch(processedText, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(6000),
        });
        if (response.ok) {
          const html = await response.text();
          const cleanText = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          processedText = `URL: ${processedText}\n\nExtracted Job Description:\n${cleanText.slice(0, 10000)}`;
        }
      } catch (e) {
        // Fall back to the raw URL text string
      }
    }

    const cvRow = db.prepare('SELECT value FROM user_settings WHERE key = ?').get('master_cv') as { value: string } | undefined;
    const cvPdfRow = db.prepare('SELECT value FROM user_settings WHERE key = ?').get('master_cv_pdf') as { value: string } | undefined;

    const masterCv = {
      text: cvRow?.value || '',
      pdfBase64: cvPdfRow?.value || undefined
    };

    const analysis = await analyzeJobPosting({ text: processedText, imageBase64, mimeType }, masterCv);
    res.json(analysis);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET timeline notes for a job application
router.get('/:id/notes', (req: Request, res: Response) => {
  try {
    const notes = db.prepare('SELECT * FROM job_timeline_notes WHERE job_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json(notes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST new timeline note for a job application
router.post('/:id/notes', (req: Request, res: Response) => {
  try {
    const { note, note_type } = req.body;
    if (!note) return res.status(400).json({ error: 'Note text is required' });

    const stmt = db.prepare('INSERT INTO job_timeline_notes (job_id, note, note_type) VALUES (?, ?, ?)');
    const result = stmt.run(req.params.id, note, note_type || 'Note');
    const created = db.prepare('SELECT * FROM job_timeline_notes WHERE id = ?').get(result.lastInsertRowid);

    // Update last_contact_at
    db.prepare('UPDATE job_applications SET last_contact_at = ? WHERE id = ?').run(new Date().toISOString(), req.params.id);

    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST generate tailored cover letter
router.post('/:id/cover-letter', async (req: Request, res: Response) => {
  try {
    const job = db.prepare('SELECT * FROM job_applications WHERE id = ?').get(req.params.id) as any;
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const cvRow = db.prepare('SELECT value FROM user_settings WHERE key = ?').get('master_cv') as { value: string } | undefined;
    const cvPdfRow = db.prepare('SELECT value FROM user_settings WHERE key = ?').get('master_cv_pdf') as { value: string } | undefined;
    const templateRow = db.prepare('SELECT value FROM user_settings WHERE key = ?').get('cover_letter_template') as { value: string } | undefined;

    const masterCv = {
      text: cvRow?.value || '',
      pdfBase64: cvPdfRow?.value || undefined
    };

    const content = await generateTailoredCoverLetter(job, masterCv, templateRow?.value || '');

    const result = db.prepare(`
      INSERT INTO cover_letters (job_id, title, content_markdown)
      VALUES (?, ?, ?)
    `).run(job.id, `Cover Letter - ${job.company}`, content);

    const created = db.prepare('SELECT * FROM cover_letters WHERE id = ?').get(result.lastInsertRowid);
    res.json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET stream cover letter as PDF
router.get('/:id/cover-letter/pdf', async (req: Request, res: Response) => {
  try {
    const job = db.prepare('SELECT * FROM job_applications WHERE id = ?').get(req.params.id) as any;
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const latestCoverLetter = db.prepare('SELECT * FROM cover_letters WHERE job_id = ? ORDER BY created_at DESC LIMIT 1').get(req.params.id) as any;
    if (!latestCoverLetter) {
      return res.status(404).json({ error: 'No cover letter generated for this job yet' });
    }

    const pdfBuffer = await createCoverLetterPDF(job.company, job.title, latestCoverLetter.content_markdown);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Cover_Letter_${job.company.replace(/\s+/g, '_')}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET / PUT master CV
router.get('/settings/cv', (req: Request, res: Response) => {
  const row = db.prepare('SELECT value FROM user_settings WHERE key = ?').get('master_cv') as { value: string } | undefined;
  res.json({ master_cv: row?.value || '' });
});

router.post('/settings/cv', (req: Request, res: Response) => {
  const { master_cv } = req.body;
  db.prepare('INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)').run('master_cv', master_cv);
  res.json({ success: true, message: 'Master CV updated' });
});

// POST upload Master CV in PDF format
router.post('/settings/cv-pdf', (req: Request, res: Response) => {
  try {
    const { pdfBase64, filename, filesize } = req.body;
    if (!pdfBase64) {
      return res.status(400).json({ error: 'No PDF data provided' });
    }

    db.prepare('INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)').run('master_cv_pdf', pdfBase64);
    db.prepare('INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)').run('master_cv_filename', filename || 'resume.pdf');
    db.prepare('INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)').run('master_cv_filesize', String(filesize || 0));
    db.prepare('INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)').run('master_cv_updated_at', new Date().toISOString());

    res.json({
      success: true,
      message: 'Master CV (PDF) successfully uploaded and linked to Gemini engine',
      filename: filename || 'resume.pdf'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET download Master CV PDF
router.get('/settings/cv-pdf', (req: Request, res: Response) => {
  try {
    const row = db.prepare('SELECT value FROM user_settings WHERE key = ?').get('master_cv_pdf') as { value: string } | undefined;
    const nameRow = db.prepare('SELECT value FROM user_settings WHERE key = ?').get('master_cv_filename') as { value: string } | undefined;

    if (!row || !row.value) {
      return res.status(404).json({ error: 'No Master CV PDF uploaded yet' });
    }

    const pdfBuffer = Buffer.from(row.value, 'base64');
    const filename = nameRow?.value || 'Master_CV.pdf';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET / POST cover letter template
router.get('/settings/template', (req: Request, res: Response) => {
  const row = db.prepare('SELECT value FROM user_settings WHERE key = ?').get('cover_letter_template') as { value: string } | undefined;
  res.json({ template: row?.value || '' });
});

router.post('/settings/template', (req: Request, res: Response) => {
  try {
    const { template } = req.body;
    db.prepare('INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)').run('cover_letter_template', template || '');
    
    // Also save to reference materials directory
    try {
      const refPath = path.resolve(process.cwd(), 'reference_materials', 'cover_letter', 'reference_cover_letter.txt');
      fs.writeFileSync(refPath, template || '', 'utf-8');
    } catch (e) {
      // ignore
    }

    res.json({ success: true, message: 'Reference cover letter template updated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Settings summary (CV PDF info & Gemini status)
router.get('/settings/status', async (req: Request, res: Response) => {
  try {
    const pdfRow = db.prepare('SELECT value FROM user_settings WHERE key = ?').get('master_cv_pdf') as { value: string } | undefined;
    const nameRow = db.prepare('SELECT value FROM user_settings WHERE key = ?').get('master_cv_filename') as { value: string } | undefined;
    const sizeRow = db.prepare('SELECT value FROM user_settings WHERE key = ?').get('master_cv_filesize') as { value: string } | undefined;
    const dateRow = db.prepare('SELECT value FROM user_settings WHERE key = ?').get('master_cv_updated_at') as { value: string } | undefined;
    const templateRow = db.prepare('SELECT value FROM user_settings WHERE key = ?').get('cover_letter_template') as { value: string } | undefined;

    const geminiStatus = await pingGemini();
    const referenceMaterialsPath = path.resolve(process.cwd(), 'reference_materials');

    res.json({
      has_pdf: !!(pdfRow && pdfRow.value),
      filename: nameRow?.value || null,
      filesize: sizeRow?.value ? parseInt(sizeRow.value, 10) : null,
      updated_at: dateRow?.value || null,
      cover_letter_template: templateRow?.value || '',
      reference_folder_path: referenceMaterialsPath,
      gemini: geminiStatus,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST update and test Gemini API Key
router.post('/settings/gemini-key', async (req: Request, res: Response) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    setGeminiApiKey(apiKey);
    db.prepare('INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)').run('gemini_api_key', apiKey);

    // Test the key
    const pingResult = await pingGemini();

    res.json({
      success: pingResult.status === 'connected',
      status: pingResult.status,
      message: pingResult.message,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
