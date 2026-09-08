import { test, expect } from '../fixtures/pages';
import { createBug, deleteBugIfExists } from './test-helpers';

test.describe('Delete Bug - create then delete', () => {
  let title: string;

  test.beforeEach(async ({ page, loginPage, boardPage, createBugModal }) => {
    await loginPage.goto();
    await loginPage.login('buggy', '1970beetle');
    title = `delete-bug-${Date.now()}`;
    await createBug(page, title, boardPage, createBugModal);
  });

  test.afterEach(async ({ page, boardPage, editBugModal }) => {
    await deleteBugIfExists(page, title, boardPage, editBugModal);
  });

  test('should_create_then_delete_bug', async ({ page, boardPage, editBugModal }) => {
    // Act
    await boardPage.openBug(title);
    await expect(editBugModal.dialog).toBeVisible();
    await editBugModal.delete();

    // Assert
    await expect(boardPage.bugTitle(title)).not.toBeVisible();
  });
});
