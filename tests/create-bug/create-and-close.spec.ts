import { test, expect } from '@playwright/test';
import { mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { LoginPage } from '../pages/LoginPage';
import { BoardPage } from '../pages/BoardPage';
import { CreateBugModal } from '../pages/CreateBugModal';

test('create a bug then edit it to Closed and capture screenshots', async ({ page }) => {
  const screenshotsDir = join(process.cwd(), 'playwright-screenshots');
  mkdirSync(screenshotsDir, { recursive: true });

  // Read credentials from users.json (first user)
  const usersPath = join(process.cwd(), 'users.json');
  const usersRaw = readFileSync(usersPath, 'utf-8');
  const users = JSON.parse(usersRaw) as Array<{ username: string; password: string }>;
  const user = users[0];

  const login = new LoginPage(page);
  await login.goto();
  await login.login(user.username, user.password);
  await page.waitForURL('**/board');
  await page.screenshot({ path: join(screenshotsDir, '01-logged-in.png'), fullPage: true });

  const board = new BoardPage(page);
  await board.newBugButton.click();
  await page.screenshot({ path: join(screenshotsDir, '02-create-modal-open.png') });

  const createModal = new CreateBugModal(page);
  const title = `e2e bug ${Date.now()}`;
  await createModal.fillBugForm({
    title,
    severity: 'high',
    owner: user.username,
    description: 'Created by automated test',
  });
  await page.screenshot({ path: join(screenshotsDir, '03-create-filled.png') });
  await createModal.submit();

  // Wait for the new bug to appear in the table
  const row = board.bugRow(title);
  await expect(row).toBeVisible();
  await page.screenshot({ path: join(screenshotsDir, '04-bug-created.png'), fullPage: true });

  // Open the bug for editing
  await board.openBug(title);
  // Wait for edit dialog to appear
  const editDialog = board.editDialog();
  await expect(editDialog).toBeVisible();
  await page.screenshot({ path: join(screenshotsDir, '05-edit-modal-open.png') });

  // Change state to Closed
  const stateSelect = editDialog.getByLabel('State');
  await stateSelect.selectOption({ value: 'closed' });
  await page.screenshot({ path: join(screenshotsDir, '06-state-set-to-closed.png') });

  // Click Save in edit modal
  await board.dialogButton('Save').click();
  // Wait for modal to close and board to refresh
  await expect(editDialog).toBeHidden();

  // Show Closed bugs and verify the bug appears there
  await board.closedFilterButton.click();
  const closedRow = board.bugRow(title);
  await expect(closedRow).not.toBeVisible();
  await page.screenshot({ path: join(screenshotsDir, '07-bug-closed-in-board.png'), fullPage: true });
});
