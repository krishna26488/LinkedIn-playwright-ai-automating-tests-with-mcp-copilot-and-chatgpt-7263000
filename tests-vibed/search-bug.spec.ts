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

const bugTitle = 'Playwright bug 1788465240318';

test('searches for a bug by title', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel(/username/i).fill(user.username);
  await page.getByLabel(/password/i).fill(user.password);
  await page.getByRole('button', { name: /login|sign in/i }).click();

  await expect(page).not.toHaveURL(/login/i);

  const searchField = page.getByRole('search', { name: 'Search bugs by title' });
  await searchField.fill(bugTitle);

  await expect(page.getByText(bugTitle, { exact: true })).toBeVisible();
});
