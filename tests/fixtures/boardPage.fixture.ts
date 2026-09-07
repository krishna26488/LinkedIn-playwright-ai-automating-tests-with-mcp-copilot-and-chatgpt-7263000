import { expect } from "@playwright/test";
import { BoardPage } from "../pages/BoardPage";
import { test as base } from "./loginPage.fixture";

type PageObjectFixtures = {
  boardPage: BoardPage;
};

export const test = base.extend<PageObjectFixtures>({
  boardPage: async ({ page }, use) => {
    await use(new BoardPage(page));
  },
});

export { expect };
