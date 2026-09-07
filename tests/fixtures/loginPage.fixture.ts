import { test as base, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

type PageObjectFixtures = {
  loginPage: LoginPage;
};

export const test = base.extend<PageObjectFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});

export { expect };
