import { test, expect } from '@playwright/test';

test.describe('QA Automation Sandbox Challenges', () => {
  test('Challenge 1: should wait for async spinner and verify loaded table rows', async ({ page }) => {
    await page.goto('/sandbox/async');
    await expect(page.getByRole('heading', { name: 'Async Delayed Loading Challenge' })).toBeVisible();

    const loadBtn = page.getByTestId('load-button');
    await loadBtn.click();

    // Verify spinner appears
    const spinner = page.getByTestId('loading-spinner');
    await expect(spinner).toBeVisible();

    // Verify spinner disappears and table renders with expected jobs
    await expect(spinner).toBeHidden({ timeout: 5000 });
    const table = page.getByTestId('jobs-table');
    await expect(table).toBeVisible();
    await expect(page.getByText('Senior QA Automation')).toBeVisible();
    await expect(page.getByTestId('success-message')).toContainText('Successfully loaded 3 jobs!');
  });

  test('Challenge 2: should validate form submission and error messaging', async ({ page }) => {
    await page.goto('/sandbox/forms');

    // Attempt invalid submission (<3 chars)
    await page.fill('#name', 'Jo');
    await page.fill('#email', 'jo@qa.de');
    await page.getByRole('button', { name: 'Submit Application' }).click();
    await expect(page.locator('#name-error')).toBeVisible();

    // Fix name and submit successfully
    await page.fill('#name', 'Karan QA');
    await page.getByRole('button', { name: 'Submit Application' }).click();
    await expect(page.locator('#name-error')).toBeHidden();
    await expect(page.getByTestId('form-success')).toContainText('Application submitted successfully for Karan QA!');
  });

  test('Challenge 3: should interact inside Shadow DOM component', async ({ page }) => {
    await page.goto('/sandbox/shadow-dom');

    // Playwright locator piercing shadow DOM seamlessly
    const shadowBtn = page.locator('qa-custom-widget').getByRole('button', { name: 'Trigger Automation Action' });
    await expect(shadowBtn).toBeVisible();
    await shadowBtn.click();

    await expect(page.locator('qa-custom-widget').getByText('Current Status: Automation Completed!')).toBeVisible();
  });

  test('Challenge 4: should type and submit inside nested iframe', async ({ page }) => {
    await page.goto('/sandbox/iframe');

    const frame = page.frameLocator('iframe');
    const input = frame.locator('#iframe-input');
    await input.fill('Verified with Playwright frameLocator');
    await frame.locator('#iframe-btn').click();

    await expect(frame.locator('#iframe-status')).toContainText('Confirmed: Verified with Playwright frameLocator');
  });

  test('Challenge 5: should perform authentication flow and verify session token', async ({ page }) => {
    await page.goto('/sandbox/auth');

    // Invalid login check
    await page.getByLabel('Username').fill('wronguser');
    await page.getByLabel('Password').fill('wrongpass');
    await page.getByRole('button', { name: 'Log In' }).click();
    await expect(page.locator('#error-msg')).toContainText('Invalid credentials');

    // Valid login check
    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Log In' }).click();

    await expect(page.getByRole('heading', { name: 'Welcome, Test Engineer!' })).toBeVisible();
    await expect(page.locator('#auth-token-badge')).toContainText('active_qa_session_98234');

    // Logout
    await page.getByRole('button', { name: 'Log Out' }).click();
    await expect(page.getByLabel('Username')).toBeVisible();
  });

  test('Challenge 6: should upload file and verify status and file metadata', async ({ page }) => {
    await page.goto('/sandbox/upload');
    await expect(page.getByRole('heading', { name: 'File Drag-and-Drop & Upload Challenge' })).toBeVisible();

    // Use setInputFiles to upload a test buffer
    await page.getByTestId('file-upload-input').setInputFiles({
      name: 'karan_resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF Content for Playwright Upload Test'),
    });

    await expect(page.getByTestId('upload-status')).toBeVisible();
    await expect(page.getByTestId('uploaded-file-name')).toContainText('karan_resume.pdf');
  });

  test('Challenge 7: should handle dialog events and open new popup window', async ({ page }) => {
    await page.goto('/sandbox/popups');

    // Handle alert dialog
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('QA Alert: Regression Test Started');
      await dialog.accept();
    });
    await page.getByTestId('trigger-alert-btn').click();
    await expect(page.getByTestId('dialog-result')).toContainText('Alert was accepted');

    // Handle confirm dialog
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await page.getByTestId('trigger-confirm-btn').click();
    await expect(page.getByTestId('dialog-result')).toContainText('Confirm Accepted: YES');

    // Handle popup window event
    const popupPromise = page.waitForEvent('popup');
    await page.getByTestId('open-popup-btn').click();
    const popup = await popupPromise;
    await popup.waitForLoadState();

    await expect(popup.getByTestId('popup-child-heading')).toContainText('Child Window Target');
    await popup.close();
  });
});
