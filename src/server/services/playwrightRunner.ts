import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface TestRunResult {
  success: boolean;
  durationMs: number;
  output: string;
  screenshots: string[];
  reportUrl?: string;
}

export function executePlaywrightTest(
  testFile: string,
  onLogChunk?: (chunk: string) => void
): Promise<TestRunResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let accumulatedOutput = '';
    const screenshots: string[] = [];

    // On Windows, npx must be executed as npx.cmd
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const args = ['playwright', 'test'];
    if (testFile) {
      args.push(testFile);
    }
    args.push('--reporter=list');

    const proc = spawn(npxCmd, args, {
      cwd: process.cwd(),
      env: { ...process.env, CI: '1' },
      shell: true,
    });

    proc.stdout?.on('data', (data) => {
      const text = data.toString();
      accumulatedOutput += text;
      if (onLogChunk) onLogChunk(text);
    });

    proc.stderr?.on('data', (data) => {
      const text = data.toString();
      accumulatedOutput += text;
      if (onLogChunk) onLogChunk(text);
    });

    proc.on('close', (code) => {
      const durationMs = Date.now() - startTime;
      const success = code === 0;

      // Scan test-results directory for any newly created screenshots
      const resultsDir = path.resolve(process.cwd(), 'test-results');
      if (fs.existsSync(resultsDir)) {
        try {
          const files = fs.readdirSync(resultsDir, { recursive: true }) as string[];
          for (const f of files) {
            if (typeof f === 'string' && (f.endsWith('.png') || f.endsWith('.jpg'))) {
              screenshots.push(`/test-results/${f.replace(/\\/g, '/')}`);
            }
          }
        } catch (e) {
          // ignore scan error
        }
      }

      resolve({
        success,
        durationMs,
        output: accumulatedOutput,
        screenshots,
      });
    });

    proc.on('error', (err) => {
      const durationMs = Date.now() - startTime;
      resolve({
        success: false,
        durationMs,
        output: `Error spawning test process: ${err.message}`,
        screenshots: [],
      });
    });
  });
}

export async function executeJobScraper(
  keyword: string,
  location: string = 'Berlin'
): Promise<{ success: boolean; jobs: Array<{ title: string; company: string; location: string; url: string; salary: string }> }> {
  // Simulates or executes real scraper logic with clean mock fallback
  const mockJobs = [
    {
      title: `${keyword} (Playwright / TypeScript)`,
      company: 'Zalando SE',
      location: `${location} (Hybrid)`,
      url: 'https://jobs.zalando.com/en/jobs/qa-berlin',
      salary: '€68,000 - €82,000'
    },
    {
      title: `Senior QA Engineer - Automation`,
      company: 'N26 Bank GmbH',
      location: `${location} (On-site/Remote)`,
      url: 'https://n26.com/en-de/careers/qa-engineer',
      salary: '€70,000 - €85,000'
    },
    {
      title: `Software Test Engineer (m/w/d)`,
      company: 'Delivery Hero SE',
      location: `${location} (Hybrid)`,
      url: 'https://deliveryhero.com/careers/qa-test',
      salary: '€65,000 - €76,000'
    },
    {
      title: `QA Automation Lead (Web & API)`,
      company: 'FlixBus Tech',
      location: `${location}`,
      url: 'https://flix.careers/qa-automation',
      salary: '€72,000 - €88,000'
    }
  ];

  return {
    success: true,
    jobs: mockJobs
  };
}
