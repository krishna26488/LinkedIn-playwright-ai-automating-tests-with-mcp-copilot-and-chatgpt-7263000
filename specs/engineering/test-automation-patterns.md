# Playwright Test Automation Patterns

This document is the project-wide context for Playwright test automation. New tests and refactors must follow these patterns.

## Page Objects

Use the Page Object Model described in the Playwright documentation: https://playwright.dev/docs/pom.

- New and refactored Playwright tests must use page objects instead of long, raw `page` call chains.
- Page object classes belong under `tests/pages/`.
- Create one page object class for each application page, with one class per file.
- The current application pages are represented by `tests/pages/LoginPage.ts` and `tests/pages/BoardPage.ts`.
- A page object owns its `Page` instance, initializes locators in its constructor, and exposes meaningful methods for user actions and page-level assertions.
- Keep selectors and interaction details inside page objects. Tests should describe behavior and assertions rather than implementation details.
- Use Playwright `Locator` instances and role-, label-, and other user-facing locators where available. Avoid brittle CSS or XPath selectors.
- Page object methods should model a coherent action or page operation, such as logging in, opening a bug, or selecting a board filter.
- Keep test data setup and API helpers outside page objects unless the operation is part of the page's user-facing behavior.
- Do not create multiple page object classes in one file. If a new routed page is added, add its own class file under `tests/pages/`.

## Page Object Fixtures

Use Playwright test fixtures to construct page objects. Tests must use page object fixtures instead of importing page object classes and constructing them directly.

- Add a fixture file under `tests/fixtures/` for each page object, using a name that identifies the page object, such as `loginPage.fixture.ts` or `boardPage.fixture.ts`.
- Define fixtures with `test.extend`, following the Playwright fixture pattern: https://playwright.dev/docs/test-fixtures.
- The fixture receives Playwright's built-in `page` fixture, constructs the page object with that page, and passes it to `use`.
- Export the extended `test` from the fixture module, and export `expect` from `@playwright/test` when tests need assertions.
- When a test needs multiple page object fixtures, compose them into the test fixture module used by that test suite so every page object is still created by a fixture.
- Tests must import `test` from the appropriate fixture module and use named fixtures in the test callback, for example `async ({ loginPage, boardPage }) => { ... }`.
- Do not import page object classes or call constructors such as `new LoginPage(page)` or `new BoardPage(page)` from test files.
- Keep fixture setup limited to page object construction. Authentication, data setup, and other workflow actions belong in the test or in a separate purpose-specific fixture.

Example fixture:

```ts
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
```

Example test usage:

```ts
import { expect, test } from "../fixtures/loginPage.fixture";

test("logs in successfully", async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.login("testuser", "password");
  await expect(loginPage.page).toHaveURL(/\/board$/);
});
```

## Test Structure

- Keep tests atomic and independent.
- Use Arrange-Act-Assert structure.
- Use `beforeEach` and `afterEach` for repeatable setup and cleanup when a test requires data.
- Prefer fixtures and API setup for deterministic test data, while exercising the user workflow through page objects.
- Assert user-visible outcomes with Playwright web-first assertions.
- Keep API response assertions for persistence and contract checks where the UI cannot provide equivalent evidence.

## Naming and Maintenance

- Name page object files after the page class, using PascalCase: `LoginPage.ts`, `BoardPage.ts`.
- Name page object classes with the same PascalCase name as their file.
- When modifying an existing test, refactor the touched workflow to use the relevant page object rather than adding more raw page calls.
- Keep page objects small and focused. Add a method only when it expresses a reusable page operation or keeps test intent clear.
