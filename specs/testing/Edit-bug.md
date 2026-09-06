# Edit Bug End-to-End Test Plan

## Application Overview

End-to-end coverage for editing an existing BuggyBoard bug from the authenticated board. Use a fresh API-created bug per test, authenticate through the UI with the first user in users.json, locate the bug by an exact unique title, and delete it in teardown with DELETE /api/bugs/<id>. Use role-based locators and observe PUT/GET requests where persistence matters. Live exploration verified: the dialog is titled Edit bug #<id>; ID is read-only; Title, Severity, State, Owner, and Description are present; Severity has HIGH/MID/LOW with live color styling; Save starts disabled with no changes; blank Title/Owner/Description disable Save; backdrop preserves drafts; Save sends PUT and closes; Cancel, X, and Escape discard drafts; State is editable and persisted. Verification gaps to retain in implementation: the UI has no blank Severity option, so a UI-only test cannot clear Severity; Delete is present but is outside feature 09 and is intentionally not covered here; backend/database persistence should be asserted through the API because the browser alone cannot inspect the database directly.

## Test Scenarios

### 1. Edit existing bug

**Seed:** `tests/seed.spec.ts`

#### 1.1. Opens modal with persisted data and controls

**File:** `tests/edit-bug/open-modal.spec.ts`

**Steps:**
  1. Arrange: Login through the UI, POST a unique bug with known ID-independent title, HIGH severity, owner, description, and open state, then load the board.
    - expect: The unique bug row is visible.
  2. Act: Click that bug row.
    - expect: A dialog named Edit bug #<id> is visible and shows the ID, title, state, severity, owner, and description.
    - expect: Save, Cancel, and Close controls are visible.
  3. Assert: Inspect edit controls.
    - expect: ID is read-only.
    - expect: Title, Severity, Owner, and Description are editable.
  4. Cleanup: DELETE the created bug by ID.
    - expect: The created bug is removed.

#### 1.2. Severity dropdown exposes options and matching color tokens

**File:** `tests/edit-bug/severity-control.spec.ts`

**Steps:**
  1. Arrange: Login, create a HIGH bug through the API, and open it from the board.
    - expect: The edit dialog is open with HIGH selected.
  2. Act: Inspect and select HIGH, MID, and LOW in the Severity combobox.
    - expect: The only options are HIGH, MID, and LOW.
  3. Assert: Compare selected-control computed colors with the severity CSS tokens and board styling.
    - expect: HIGH resolves to #b84a2e, MID to #a67c47, and LOW to #4a6b5e, with the selected value visibly color-coded.
  4. Cleanup: Cancel and DELETE the bug.
    - expect: No edit is persisted and the bug is removed.

#### 1.3. Save is disabled without changes

**File:** `tests/edit-bug/save-disabled-no-changes.spec.ts`

**Steps:**
  1. Arrange: Login, create a known bug through the API, and open its edit dialog without changing any field.
    - expect: The dialog is visible.
  2. Act: Observe Save and the API request log.
    - expect: Save is disabled and no PUT request is sent.
  3. Assert: Confirm the original API representation is unchanged.
    - expect: The bug values remain unchanged.
  4. Cleanup: Cancel and DELETE the bug.
    - expect: The bug is removed.

#### 1.4. Save is disabled when Title is blank

**File:** `tests/edit-bug/blank-title.spec.ts`

**Steps:**
  1. Arrange: Login, create a known bug, and open its edit dialog.
    - expect: Save is initially disabled.
  2. Act: Clear only Title.
    - expect: Save is disabled and no PUT request is sent.
  3. Assert: Fill the original title back in.
    - expect: The field is valid again and no invalid request was sent.
  4. Cleanup: Cancel and DELETE the bug.
    - expect: The bug is removed.

#### 1.5. Save is disabled when Owner is blank

**File:** `tests/edit-bug/blank-owner.spec.ts`

**Steps:**
  1. Arrange: Login, create a known bug, and open its edit dialog.
    - expect: Save is initially disabled.
  2. Act: Clear only Owner.
    - expect: Save is disabled and no PUT request is sent.
  3. Assert: Fill the original owner back in.
    - expect: The field is valid again and no invalid request was sent.
  4. Cleanup: Cancel and DELETE the bug.
    - expect: The bug is removed.

#### 1.6. Save is disabled when Description is blank

**File:** `tests/edit-bug/blank-description.spec.ts`

**Steps:**
  1. Arrange: Login, create a known bug, and open its edit dialog.
    - expect: Save is initially disabled.
  2. Act: Clear only Description.
    - expect: Save is disabled and no PUT request is sent.
  3. Assert: Fill the original description back in.
    - expect: The field is valid again and no invalid request was sent.
  4. Cleanup: Cancel and DELETE the bug.
    - expect: The bug is removed.

#### 1.7. Backdrop preserves an unsaved draft

**File:** `tests/edit-bug/backdrop-does-not-close.spec.ts`

**Steps:**
  1. Arrange: Login, create a known bug, open it, and change Title to a unique draft.
    - expect: Save is enabled and the draft is visible.
  2. Act: Click the dimmed area outside the modal panel.
    - expect: The dialog remains open, the draft remains visible, and no PUT request is sent.
  3. Assert: Confirm Cancel and Save remain available.
    - expect: The user can continue editing or explicitly cancel.
  4. Cleanup: Cancel and DELETE the bug.
    - expect: The draft is discarded and the bug is removed.

#### 1.8. Save persists edits after reopening

**File:** `tests/edit-bug/save-persists.spec.ts`

**Steps:**
  1. Arrange: Login, create a known open bug through the API, and open it.
    - expect: The dialog shows the seeded values.
  2. Act: Change Title, Severity to LOW, Owner, and Description, then click Save.
    - expect: One successful PUT /api/bugs/<id> contains the edited payload.
    - expect: The modal closes and the board shows the edited title and severity.
  3. Assert: Reopen the row and GET /api/bugs/<id>.
    - expect: All edited values persist, the ID is unchanged, and unrelated bugs are unchanged.
  4. Cleanup: DELETE the bug.
    - expect: The bug is removed.

#### 1.9. Cancel discards edits

**File:** `tests/edit-bug/cancel-discards.spec.ts`

**Steps:**
  1. Arrange: Login, create a known bug, open it, and change a field to a unique draft.
    - expect: Save is enabled.
  2. Act: Click Cancel.
    - expect: The modal closes and no PUT request is sent.
  3. Assert: Reopen or GET the bug.
    - expect: All original values remain unchanged.
  4. Cleanup: DELETE the bug.
    - expect: The bug is removed.

#### 1.10. Close button discards edits

**File:** `tests/edit-bug/close-discards.spec.ts`

**Steps:**
  1. Arrange: Login, create a known bug, open it, and change Title to a unique draft.
    - expect: The draft is visible.
  2. Act: Click the upper-right Close button.
    - expect: The modal closes and no PUT request is sent.
  3. Assert: Reopen or GET the bug.
    - expect: The original title and other values remain unchanged.
  4. Cleanup: DELETE the bug.
    - expect: The bug is removed.

#### 1.11. Escape discards edits

**File:** `tests/edit-bug/escape-discards.spec.ts`

**Steps:**
  1. Arrange: Login, create a known bug, open it, and change Title to a unique draft.
    - expect: The draft is visible.
  2. Act: Press Escape.
    - expect: The modal closes and no PUT request is sent.
  3. Assert: Reopen or GET the bug.
    - expect: The original title and other values remain unchanged.
  4. Cleanup: DELETE the bug.
    - expect: The bug is removed.

#### 1.12. Observed State field persists

**File:** `tests/edit-bug/state-observed.spec.ts`

**Steps:**
  1. Arrange: Login, create an open bug, and open its edit dialog.
    - expect: An editable State combobox has Open and Closed options.
  2. Act: Select Closed and Save.
    - expect: PUT succeeds with state: closed and the modal closes.
  3. Assert: Open the Closed board filter and reopen the bug.
    - expect: The bug appears there and State is Closed.
  4. Cleanup: DELETE the bug.
    - expect: The bug is removed.
