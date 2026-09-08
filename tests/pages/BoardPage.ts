import { expect, type Locator, type Page } from '@playwright/test';

export class BoardPage {
  readonly page: Page;
  readonly newBugButton: Locator;
  readonly logoutButton: Locator;
  readonly searchInput: Locator;
  readonly clearSearchButton: Locator;
  readonly openFilterButton: Locator;
  readonly closedFilterButton: Locator;
  readonly bugsTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newBugButton = page.getByRole('button', { name: 'New Bug' });
    this.logoutButton = page.getByRole('button', { name: 'Logout' });
    this.searchInput = page.getByRole('search', { name: 'Search bugs by title' });
    this.clearSearchButton = page.getByRole('button', { name: 'Clear search' });
    this.openFilterButton = page.getByRole('button', { name: 'Open', exact: true });
    this.closedFilterButton = page.getByRole('button', { name: 'Closed', exact: true });
    this.bugsTable = page.getByRole('table', { name: 'Bugs' });
  }

  async goto() {
    await this.page.goto('/board');
  }

  async reload() {
    await this.page.reload();
  }

  async openCreateBug() {
    await this.newBugButton.click();
  }

  createBugDialog() {
    return this.page.getByRole('dialog', { name: 'Create bug' });
  }

  bugRow(title: string) {
    return this.page.getByRole('button').filter({ hasText: title }).first();
  }

  bugTitle(title: string | RegExp) {
    return this.page.getByRole('cell', { name: title, exact: true });
  }

  async openBug(title: string) {
    const row = this.bugRow(title);
    await expect(row).toBeVisible();
    await row.click();
  }

  async openBugByRowName(name: string | RegExp) {
    const row = this.page.getByRole('button', { name }).first();
    await expect(row).toBeVisible();
    await row.click();
  }

  editDialog() {
    return this.page.getByRole('dialog', { name: /^Edit bug #/ });
  }

  deleteConfirmationDialog() {
    return this.page.getByRole('dialog', { name: 'Delete bug?' });
  }

  activeBugDialog() {
    return this.createBugDialog().or(this.editDialog());
  }

  dialogField(label: string) {
    return this.activeBugDialog().getByLabel(label);
  }

  dialogButton(name: string) {
    return this.activeBugDialog().getByRole('button', { name, exact: true });
  }

  confirmationButton(name: string) {
    return this.deleteConfirmationDialog().getByRole('button', { name, exact: true });
  }

  async searchFor(title: string) {
    await this.searchInput.fill(title);
  }

  async clearSearch() {
    await this.clearSearchButton.click();
  }
}
