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
      description: 'Delete persistence test bug.',
    },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as Bug;
}

test.describe('Delete Bug', () => {
  let createdBugId: number | undefined;
  let createdBugTitle: string;

  test.beforeEach(async ({ page, request }) => {
    const loginPage = new LoginPage(page);
    const boardPage = new BoardPage(page);
    await loginPage.goto();
    await loginPage.login(username, password);
    createdBugTitle = `Delete persistence test ${randomUUID()}`;
    const bug = await createBug(request, createdBugTitle);
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

  test('does not restore the deleted bug after a board reload', async ({ page, request }) => {
    const boardPage = new BoardPage(page);
    await boardPage.openBug(createdBugTitle);
    const dialog = boardPage.editDialog();
    await boardPage.dialogButton('Delete').click();
    await expect(dialog).not.toBeVisible();
    await expect(boardPage.bugTitle(createdBugTitle)).not.toBeVisible();

    await boardPage.reload();
    await expect(boardPage.bugTitle(createdBugTitle)).not.toBeVisible();

    const response = await request.get(`/api/bugs/${createdBugId}`);
    expect(response.status()).toBe(404);
  });
});