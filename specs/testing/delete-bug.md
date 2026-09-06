# BuggyBoard Delete Bug End-to-End Test Plan

## Application Overview

End-to-end coverage for deleting a bug from the authenticated BuggyBoard board. Each test must create its own fresh bug during setup, use a unique title to identify that bug, and remove any remaining test data during teardown. The delete action is performed through the Edit bug modal.

Live Playwright CLI observation verified that the edit modal is titled `Edit bug #<id>`, exposes a `Delete` button, and that clicking Delete sends `DELETE /api/bugs/<id>` with `204 No Content`. The modal closes immediately, the deleted row is removed from the board, and the board refreshes its bug list. No confirmation dialog appeared.

## Test Conventions

- Authenticate through the UI with the first account in `users.json` (`buggy`).
- Create a new bug through the API in each test's setup, using a unique title and known description, severity, owner, and open state.
- Load or refresh the board after setup and locate the test bug by its exact unique title, not by a hard-coded ID or row position.
- Use role-based locators: the bug row, dialog named `Edit bug #<id>`, and button named `Delete`.
- Observe the relevant API request when persistence matters.
- Delete any created bug that still exists in teardown so failed tests do not leave shared data behind.

## Test Scenarios

### 1. Delete control is available in the edit modal

**File:** `tests/delete-bug/delete-button.spec.ts`

**Steps:**
  1. Arrange: Start a fresh browser context, authenticate through the login page, create a fresh unique bug through the API, and open the board.
     - expect: The created bug appears in the Open board by its exact unique title.
  2. Act: Click the row for the created bug.
     - expect: A dialog named `Edit bug #<id>` is visible.
  3. Assert: Inspect the dialog actions.
     - expect: A visible button named `Delete` is present.
     - expect: `Cancel` and `Save` are also present, and the existing bug values are displayed.
  4. Cleanup: Close the modal without deleting through the scenario, then delete the created bug through the API.
     - expect: The test bug is removed and no test data remains.

### 2. Deleting a bug closes the modal and removes its board row

**File:** `tests/delete-bug/deletes-bug-from-board.spec.ts`

**Steps:**
  1. Arrange: Start a fresh browser context, authenticate through the login page, create a fresh unique bug through the API, and open the board.
     - expect: The created bug appears in the board with the expected title and ID.
  2. Act: Click the created bug row, then click the exact `Delete` button in the edit modal.
     - expect: One `DELETE /api/bugs/<id>` request is sent and returns `204 No Content`.
     - expect: No confirmation dialog is required by the current UI flow.
  3. Assert: Inspect the page after the delete request completes.
     - expect: The edit modal is closed.
     - expect: The unique bug title is no longer visible in the board.
     - expect: The bug row count decreases by one relative to the setup state, accounting for any other concurrent board data.
  4. Cleanup: Query the API by the created ID if needed.
     - expect: The bug is already absent; teardown is idempotent and does not fail if deletion succeeded.

### 3. Deletion persists after the board is reloaded

**File:** `tests/delete-bug/delete-persists-after-reload.spec.ts`

**Steps:**
  1. Arrange: Start a fresh browser context, authenticate through the login page, create a fresh unique bug through the API, and open the board.
     - expect: The created bug is visible and can be opened by its unique title.
  2. Act: Open the created bug and click `Delete`.
     - expect: `DELETE /api/bugs/<id>` returns `204 No Content`.
     - expect: The edit modal closes and the unique title disappears from the current board view.
  3. Assert: Reload the board or trigger a fresh `GET /api/bugs`.
     - expect: The response succeeds.
     - expect: No returned bug has the created ID or unique title.
     - expect: Reopening or navigating back to the Open board does not restore the deleted row.
  4. Cleanup: Confirm the created ID is absent; do not delete unrelated seeded bugs.
     - expect: The test leaves the database in its original state apart from the intentionally deleted fresh bug.

## Coverage Notes

- Tests are independent and must not reuse a bug created by another test.
- The setup-created bug is required even when the board already contains bugs, so the delete target is deterministic and owned by the test.
- Do not assert a specific numeric ID; the live app assigns IDs dynamically.
- API assertions verify persistence, while UI assertions verify the modal closure and board refresh required by the feature spec.