import { test, expect, type APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { BoardPage } from '../pages/BoardPage';
import { LoginPage } from '../pages/LoginPage';

type Bug = {
  id: number;
  title: string;
  severity: string;
  owner: string;
  description: string;
  state: string;
};

const username = 'buggy';
const password = '1970beetle';

async function createBug(request: APIRequestContext, title: string) {
  const response = await request.post('/api/bugs', {
    data: {
      title,
      severity: 'HIGH',
      owner: username,
      description: 'Delete button test bug.',
    },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as Bug;
}

test.describe('Delete Bug', () => {
  let createdBugId: number | undefined;

  test.beforeEach(async ({ page, request }) => {
    const loginPage = new LoginPage(page);
    const boardPage = new BoardPage(page);
    await loginPage.goto();
    await loginPage.login(username, password);
    const title = `Delete button test ${randomUUID()}`;
    const bug = await createBug(request, title);
    createdBugId = bug.id;
    await boardPage.reload();
  });

  test.afterEach(async ({ request }) => {
    if (createdBugId !== undefined) {
      const response = await request.delete(`/api/bugs/${createdBugId}`);
      expect([204, 404]).toContain(response.status());
      createdBugId = undefined;
    }
  });

  test('shows the delete button in the edit modal', async ({ page }) => {
    const boardPage = new BoardPage(page);
    await boardPage.openBug('Delete button test');
    const dialog = boardPage.editDialog();
    await expect(dialog).toHaveRole('dialog');
    await expect(boardPage.dialogButton('Delete')).toBeVisible();
    await expect(boardPage.dialogButton('Cancel')).toBeVisible();
    await expect(boardPage.dialogButton('Save')).toBeVisible();
  });
});