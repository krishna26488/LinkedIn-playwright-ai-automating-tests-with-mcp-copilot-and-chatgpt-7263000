import { test, expect } from "../fixtures/boardPage.fixture";
import type { APIRequestContext, Request } from "@playwright/test";
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
      description: "Delete button test bug.",
    },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as Bug;
}

test.describe("Delete Bug", () => {
  let createdBugId: number | undefined;

  test.beforeEach(async ({ loginPage, boardPage, request }) => {
    await loginPage.goto();
    await loginPage.login(username, password);
    const title = `Delete button test ${randomUUID()}`;
    const bug = await createBug(request, title);
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

  test("shows the delete button in the edit modal", async ({ boardPage }) => {
    await boardPage.openBug("Delete button test");
    const dialog = boardPage.editDialog();
    await expect(dialog).toHaveRole("dialog");
    await expect(boardPage.dialogButton("Delete")).toBeVisible();
    await expect(boardPage.dialogButton("Cancel")).toBeVisible();
    await expect(boardPage.dialogButton("Save")).toBeVisible();
  });

  test("shows a confirmation modal before deleting", async ({ boardPage }) => {
    await boardPage.openBug("Delete button test");
    await boardPage.dialogButton("Delete").click();

    const confirmation = boardPage.deleteConfirmationDialog();
    await expect(confirmation).toBeVisible();
    await expect(confirmation).toContainText("Are you sure you want to delete this bug?");
    await expect(boardPage.confirmationButton("Cancel")).toBeVisible();
    await expect(boardPage.confirmationButton("Delete")).toBeVisible();
  });

  test("cancelling deletion keeps the bug and edit modal open", async ({ page, boardPage }) => {
    await boardPage.openBug("Delete button test");
    const editDialog = boardPage.editDialog();
    const deleteRequests: Request[] = [];
    const requestHandler = (request: Request) => {
      if (request.method() === "DELETE" && request.url().includes("/api/bugs/")) {
        deleteRequests.push(request);
      }
    };
    page.on("request", requestHandler);

    await boardPage.dialogButton("Delete").click();
    await boardPage.confirmationButton("Cancel").click();
    page.off("request", requestHandler);

    expect(deleteRequests).toHaveLength(0);
    await expect(boardPage.deleteConfirmationDialog()).not.toBeVisible();
    await expect(editDialog).toBeVisible();
    await expect(boardPage.bugTitle(/Delete button test/)).toBeVisible();
  });
});
