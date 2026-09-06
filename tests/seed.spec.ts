import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type User = {
  username: string;
  password: string;
};

const usersFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../users.json');
const users = JSON.parse(readFileSync(usersFile, 'utf-8')) as User[];
const user = users[0];

test('logs into BuggyBoard with the first user', {tag: '@seed'}, async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel(/username/i).fill(user.username);
  await page.getByLabel(/password/i).fill(user.password);
  await page.getByRole('button', { name: /login/i }).click();

  await expect(page).toHaveURL(/\/board$/);
});
