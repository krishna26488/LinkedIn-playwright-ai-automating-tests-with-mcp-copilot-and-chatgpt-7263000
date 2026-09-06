# BuggyBoard Create Bug End-to-End Test Plan

## Application Overview

End-to-end coverage for BuggyBoard's create-bug workflow on the authenticated board page. The plan uses the repository create-bug feature spec as the behavioral baseline and incorporates live Playwright MCP observations from http://localhost:5173/board. Each test starts from a fresh authenticated browser state using tests/seed.spec.ts, which logs in with the first entry in users.json (currently buggy / 1970beetle).

## Test Scenarios

### 1. Create Bug

**Seed:** `tests/seed.spec.ts`

#### 1.1. opens the create-bug modal with all required controls

**File:** `tests/create-bug/open-modal.spec.ts`

**Steps:**
  1. Start from a fresh browser context and run the existing seed setup, which navigates to /login, fills the first users.json username and password, and submits Login.
    - expect: The user is authenticated and the URL ends with /board.
    - expect: The title bar contains a button named New Bug.
  2. Click the button named New Bug.
    - expect: A visible element with role dialog and accessible name Create bug is displayed.
    - expect: The dialog has accessible controls named Title, Severity, Owner, Description, Cancel, Save, and Close.
    - expect: Severity is a select/combobox with visible options HIGH, MID, and LOW.

#### 1.2. defaults owner to the authenticated first user

**File:** `tests/create-bug/owner-default.spec.ts`

**Steps:**
  1. Start from the fresh authenticated seed state and click New Bug.
    - expect: The Create bug dialog is visible.
  2. Read the value of the Owner textbox.
    - expect: The Owner value is buggy, matching the first user in users.json.

#### 1.3. creates and persists a bug with required fields and HIGH severity

**File:** `tests/create-bug/successful-creation.spec.ts`

**Steps:**
  1. Start from the fresh authenticated seed state and click New Bug.
    - expect: The Create bug dialog is visible with Owner pre-filled as buggy and Severity initially set to MID.
  2. Fill Title with Login fails with special characters.
    - expect: The Title control contains the exact entered text.
  3. Select HIGH in the Severity combobox.
    - expect: The selected option is HIGH.
    - expect: The selected severity uses the live HIGH color coding: terracotta text/background styling consistent with the board.
  4. Fill Description with When I use < and > in my password, login fails.
    - expect: The Description control preserves the literal < and > characters.
  5. Click Save.
    - expect: The dialog closes.
    - expect: A POST request to /api/bugs succeeds with HTTP 201 Created and contains the entered title, severity HIGH, owner buggy, and exact description.
    - expect: A subsequent board refresh/list response succeeds.
    - expect: The new bug appears on the board with a unique integer ID, HIGH severity, the entered title, and owner buggy.
  6. Reload the board or otherwise perform a fresh GET /api/bugs and locate the unique title.
    - expect: The created bug remains present with the saved field values, demonstrating persistence beyond the modal close.

#### 1.4. cancels a populated draft without saving

**File:** `tests/create-bug/cancel-does-not-persist.spec.ts`

**Steps:**
  1. Start from a fresh authenticated seed state, record the current bug-row count, and click New Bug.
    - expect: The Create bug dialog is visible.
  2. Fill Title and Description with unique draft values; leave the default Owner and Severity unchanged.
    - expect: The draft values are visible in the dialog.
  3. Click Cancel.
    - expect: The dialog closes.
    - expect: The bug-row count is unchanged.
    - expect: A fresh GET /api/bugs does not contain the draft title.

#### 1.5. closes a populated draft with the upper-right X without saving

**File:** `tests/create-bug/x-does-not-persist.spec.ts`

**Steps:**
  1. Start from a fresh authenticated seed state, record the current bug-row count, click New Bug, and fill Title and Description with unique draft values.
    - expect: The populated Create bug dialog is visible.
  2. Click the button named Close in the upper-right of the dialog, whose visible content is the X character.
    - expect: The dialog closes.
    - expect: The bug-row count is unchanged.
    - expect: A fresh GET /api/bugs does not contain the draft title.

#### 1.6. closes a populated draft with Escape without saving

**File:** `tests/create-bug/escape-does-not-persist.spec.ts`

**Steps:**
  1. Start from a fresh authenticated seed state, record the current bug-row count, click New Bug, and fill Title and Description with unique draft values.
    - expect: The populated Create bug dialog is visible.
  2. Press the Escape key.
    - expect: The dialog closes.
    - expect: The bug-row count is unchanged.
    - expect: A fresh GET /api/bugs does not contain the draft title.

#### 1.7. keeps the modal and draft open when the backdrop is clicked

**File:** `tests/create-bug/backdrop-preserves-draft.spec.ts`

**Steps:**
  1. Start from a fresh authenticated seed state and click New Bug.
    - expect: The Create bug dialog is visible.
  2. Fill Title with Backdrop behavior check and Description with Preserve this draft.
    - expect: The entered values are visible.
  3. Click the dimmed area outside the dialog panel, away from the panel bounds.
    - expect: The Create bug dialog remains visible.
    - expect: The Title and Description values are unchanged.
    - expect: No bug is saved and no new board row appears.

#### 1.8. blocks save and reports blank required fields

**File:** `tests/create-bug/required-fields.spec.ts`

**Steps:**
  1. Start from a fresh authenticated seed state, record the current bug-row count, click New Bug, and click Save without entering any values.
    - expect: The dialog remains open.
    - expect: No bug is saved and the bug-row count is unchanged.
    - expect: An accessible alert is shown identifying blank required fields; in the live app this displayed Title is required. and Description is required.
  2. For each case, open a fresh Create bug dialog, fill all other fields with valid unique values, leave exactly one field blank, and click Save: Title, Severity, Owner, then Description.
    - expect: With Title blank, save is blocked and the dialog remains open.
    - expect: With Severity blank, save is blocked and the dialog remains open.
    - expect: With Owner blank, save is blocked and the dialog remains open.
    - expect: With Description blank, save is blocked and the dialog remains open.
    - expect: Each case produces required-field feedback for the omitted field and does not add a bug.
  3. For the Owner-blank case, first clear the default buggy value. For the Severity-blank case, use the control's blank/invalid state if the application supports it; otherwise document the inability to represent blank in the native select and verify the default MID remains valid.
    - expect: The test data explicitly accounts for the live default Owner and native Severity select behavior.
