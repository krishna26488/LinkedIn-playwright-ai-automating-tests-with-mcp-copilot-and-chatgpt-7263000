# User Story

As a BuggyBoard user,
I want to delete bugs,
So that I can remove bugs that are incorrect or no longer needed.


# Design

- The "Edit bug" modal should have a "delete" button.
- Clicking the "delete" button should display a confirmation modal before deleting the bug.
- The confirmation modal should provide confirm and cancel actions.
- Cancelling the confirmation modal should leave the bug unchanged and keep the edit modal open.
- Confirming deletion should remove the bug from the database and close the modal.


# Acceptance Criteria

Scenario: Edit bug modal displays a delete button
  Given the user is authenticated into the app
  And the user is on the board page
  And there are bugs in the database
  When the user opens the edit modal for a bug
  Then the modal displays a delete button

Scenario: Clicking delete displays a confirmation modal
  Given the user is authenticated into the app
  And the user is on the board page
  And there are bugs in the database
  When the user opens the edit modal for a bug
  And the user clicks the delete button
  Then a delete confirmation modal is displayed
  And the confirmation modal provides confirm and cancel actions

Scenario: Cancelling bug deletion leaves the bug in place
  Given the user is authenticated into the app
  And the user is on the board page
  And there are bugs in the database
  When the user opens the edit modal for a bug
  And the user clicks the delete button
  And the user cancels the delete confirmation
  Then the bug remains in the database
  And the edit modal remains open
  And the board continues to display that bug

Scenario: Confirming bug deletion removes the bug and closes the modal
  Given the user is authenticated into the app
  And the user is on the board page
  And there are bugs in the database
  When the user opens the edit modal for a bug
  And the user clicks the delete button
  And the user confirms the delete confirmation
  Then the bug is removed from the database
  And the modal is closed
  And the board no longer displays that bug

