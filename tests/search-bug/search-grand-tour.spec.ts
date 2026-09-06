import { test, expect } from '@playwright/test';
import { BoardPage } from '../pages/BoardPage';
import { LoginPage } from '../pages/LoginPage';

const bugData = [
  { title: 'Login page crashes on empty password', severity: 'HIGH', owner: 'buggy', description: 'App crashes when submitting an empty password on login.' },
  { title: 'Login page redirect fails after auth', severity: 'MID', owner: 'buggy', description: 'User is not redirected to board after successful login.' },
  { title: 'Login page error message not shown', severity: 'LOW', owner: 'buggy', description: 'No error message appears for invalid credentials.' },
  { title: 'Login page enter key stops working', severity: 'MID', owner: 'buggy', description: 'Enter key does not submit the login form.' },
  { title: 'Board page fails to load', severity: 'HIGH', owner: 'buggy', description: 'The bug board is empty even when bugs exist in the database.' },
  { title: 'Search field disappears on page resize', severity: 'LOW', owner: 'buggy', description: 'The search input is not visible after resizing the window.' },
  { title: 'Severity dropdown missing on create page', severity: 'MID', owner: 'buggy', description: 'The severity dropdown does not render in the create bug modal.' },
  { title: 'Create page modal does not close on cancel', severity: 'LOW', owner: 'buggy', description: 'The create bug modal stays open after clicking Cancel.' },
  { title: 'Title bar logo missing on page load', severity: 'LOW', owner: 'buggy', description: 'The logo image does not appear in the title bar.' },
  { title: 'Sort resets on page refresh', severity: 'MID', owner: 'buggy', description: 'Sorting order is lost when the page is refreshed.' },
];

test.describe('Search Bug', () => {
  let createdBugIds: number[] = [];

  test.beforeEach(async ({ page, request }) => {
    const loginPage = new LoginPage(page);
    const boardPage = new BoardPage(page);
    await loginPage.goto();
    await loginPage.login('buggy', '1970beetle');

    // Create 10 bugs via API
    createdBugIds = [];
    for (const bug of bugData) {
      const response = await request.post('/api/bugs', { data: bug });
      const body = await response.json();
      createdBugIds.push(body.id);
    }

    // Reload so the board reflects the newly created bugs
    await boardPage.reload();
  });

  test.afterEach(async ({ request }) => {
    for (const id of createdBugIds) {
      await request.delete(`/api/bugs/${id}`);
    }
    createdBugIds = [];
  });

  test('Search bugs by title on the board page', async ({ page }) => {
    const boardPage = new BoardPage(page);

    // Search "page" → all 10 bugs visible
    await boardPage.searchFor('page');

    for (const bug of bugData) {
      await expect(boardPage.bugTitle(bug.title)).toBeVisible();
    }

    // Clear → search "login" → 4 login bugs visible, 6 non-login bugs not visible
    await boardPage.clearSearch();
    await boardPage.searchFor('login');

    for (const bug of bugData.filter((bug) => bug.title.includes('Login'))) {
      await expect(boardPage.bugTitle(bug.title)).toBeVisible();
    }

    for (const bug of bugData.filter((bug) => !bug.title.includes('Login'))) {
      await expect(boardPage.bugTitle(bug.title)).not.toBeVisible();
    }

    // Clear → search "xyzzy" → no-results message shown, no bug titles visible
    await boardPage.clearSearch();
    await boardPage.searchFor('xyzzy');

    await expect(boardPage.bugTitle('No bugs matched.')).toBeVisible();

    for (const bug of bugData) {
      await expect(boardPage.bugTitle(bug.title)).not.toBeVisible();
    }
  });
});