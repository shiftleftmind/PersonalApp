import { test, expect } from '@playwright/test';

test.describe('Personal Hub End-to-End Application Workflow', () => {
  test('should load application and navigate all three primary modules', async ({ page }) => {
    await page.goto('/');

    // 1. Verify Header & Sidebar navigation
    await expect(page.getByText('Career & Learning')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Job Hunter' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'German A0 ➔ B1' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Playwright Lab' })).toBeVisible();

    // 2. Job Hunter Module checks
    await expect(page.getByRole('heading', { name: 'Job Hunting Hub' })).toBeVisible();
    // Toggle view to table
    await page.getByRole('button', { name: 'Table' }).click();
    await expect(page.getByRole('table')).toBeVisible();
    // Toggle back to kanban
    await page.getByRole('button', { name: 'Kanban' }).click();
    await expect(page.locator('span', { hasText: 'Wishlist' }).first()).toBeVisible();

    // 3. German Learning Module checks
    await page.getByRole('button', { name: 'German A0 ➔ B1' }).click();
    await expect(page.getByRole('heading', { name: /German Learning Hub/i })).toBeVisible();
    
    // Check Alphabet & Phonetics (A0) default section
    await expect(page.getByText(/German Alphabet & Phonetics Guide/i)).toBeVisible();
    await expect(page.getByText('der Apfel')).toBeVisible();

    // Switch to Schritte A1-B1 Units tab
    await page.getByRole('button', { name: /2\. Schritte A1–B1 Units/i }).click();
    await expect(page.getByText(/Schritte Plus Neu A1\.1 & A1\.2/i)).toBeVisible();
    await expect(page.getByText(/Guten Tag & Kennenlernen/i)).toBeVisible();

    // Switch to Flashcards tab
    await page.getByRole('button', { name: /3\. Flashcards/i }).click();
    await expect(page.getByText('Listen Pronunciation')).toBeVisible();

    // Switch to Grammar tab
    await page.getByRole('button', { name: /4\. Grammar/i }).click();
    await expect(page.getByRole('button', { name: /ગુજરાતી/i })).toBeVisible();

    // Switch to QA drills tab
    await page.getByRole('button', { name: /5\. QA/i }).click();
    await expect(page.getByText(/Erwartetes Verhalten/i)).toBeVisible();

    // 4. Playwright Lab Module checks
    await page.getByRole('button', { name: 'Playwright Lab' }).click();
    await expect(page.getByRole('heading', { name: /Playwright Lab/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'QA Sandbox Targets' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Test Runner Dashboard' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Berlin Job Scraper' })).toBeVisible();

    // 5. Settings checks
    await page.getByRole('button', { name: 'CV & Settings' }).click();
    await expect(page.getByRole('heading', { name: /System Settings & Materials/i })).toBeVisible();
    await expect(page.getByText(/Reference Materials Directory/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Copy Path/i })).toBeVisible();

    // 6. Knowledge Base checks (bottom of sidebar panel)
    await page.getByRole('button', { name: /Knowledge Base & Docs/i }).click();
    await expect(page.getByRole('heading', { name: /System Knowledge Base Portal/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Playwright & Sandboxes/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /REST APIs/i })).toBeVisible();
  });
});
