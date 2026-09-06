import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type User = {
  username: string;
  password: string;
};

const usersFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../users.json');
const usersData = JSON.parse(readFileSync(usersFile, 'utf-8'));

const user: User = Array.isArray(usersData)
  ? usersData[0]
  : usersData.users?.[0] ?? usersData;

test('logs into BuggyBoard and creates a new bug', async ({ page }) => {
  const bugTitle = `Playwright bug ${Date.now()}`;
  const bugDescription = 'Bug created automatically with Playwright.';

  await page.goto('/login');

  await page.getByLabel(/username/i).fill(user.username);
  await page.getByLabel(/password/i).fill(user.password);
  await page.getByRole('button', { name: /login|sign in/i }).click();

  await expect(page).not.toHaveURL(/login/i);

  await page.getByRole('button', { name: /new bug/i }).click();

  await page.locator('#bug-title').fill(bugTitle);
  await page.getByLabel(/description/i).fill(bugDescription);

  await page.getByRole('button', { name: /save|create bug|submit/i }).click();

  await expect(page.getByText(bugTitle, { exact: true })).toBeVisible();
});