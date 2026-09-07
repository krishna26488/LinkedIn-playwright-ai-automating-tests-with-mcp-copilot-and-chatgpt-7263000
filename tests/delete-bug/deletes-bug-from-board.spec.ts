import { test, expect } from "../fixtures/boardPage.fixture";
import type { APIRequestContext } from "@playwright/test";
import { randomUUID } from "node:crypto";

type Bug = {
  id: number;
  title: string;
  severity: string;
  owner: string;
  description: string;
  state: string;
};

const username = "buggy";
const password = "1970beetle";

async function createBug(request: APIRequestContext, title: string) {
  const response = await request.post("/api/bugs", {
    data: {
      title,
      severity: "HIGH",
      owner: username,
      description: "Delete board row test bug.",
    },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as Bug;
}

test.describe("Delete Bug", () => {
  let createdBugId: number | undefined;
  let createdBugTitle: string;

  test.beforeEach(async ({ loginPage, boardPage, request }) => {
    await loginPage.goto();
    await loginPage.login(username, password);
    createdBugTitle = `Delete board row test ${randomUUID()}`;
    const bug = await createBug(request, createdBugTitle);
    createdBugId = bug.id;
    await boardPage.reload();
  });

  test.afterEach(async ({ request }) => {
    if (createdBugId !== undefined) {
      const response = await request.delete(`/api/bugs/${createdBugId}`);
      expect([204, 404]).toContain(response.status());
      createdBugId = undefined;
    }
  });

  test("closes the modal and removes the deleted bug from the board", async ({
    page,
    boardPage,
  }) => {
    await boardPage.openBug(createdBugTitle);
    const dialog = boardPage.editDialog();
    const deleteResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/bugs/${createdBugId}`) &&
        response.request().method() === "DELETE"
    );
    await boardPage.dialogButton("Delete").click();
    await expect(boardPage.deleteConfirmationDialog()).toBeVisible();
    await boardPage.confirmationButton("Delete").click();

    const deleteResponse = await deleteResponsePromise;
    expect(deleteResponse.status()).toBe(204);
    await expect(dialog).not.toBeVisible();
    await expect(boardPage.bugTitle(createdBugTitle)).not.toBeVisible();
  });
});
