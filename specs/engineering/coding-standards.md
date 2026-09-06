# Coding Standards

- **Be simple and direct** rather than complicated and clever.
- **Resolve all errors and linter warnings** before considering a task complete.
- **Keep packages up to date** within the constraints of the stack.
- **Follow Domain Driven Design (DDD) principles** where applicable (bounded contexts, clear domain language, see `specs/product/glossary.md`).
- **Keep business logic in the service layer** and out of the frontend as much as possible; the frontend should orchestrate and display, not implement core rules.

## Playwright Tests

- Follow [`test-automation-patterns.md`](test-automation-patterns.md) for all new and refactored Playwright tests.
- Use page objects under `tests/pages/` instead of long raw `page` call chains.
- Keep one page object class per file and one class for each application page.
