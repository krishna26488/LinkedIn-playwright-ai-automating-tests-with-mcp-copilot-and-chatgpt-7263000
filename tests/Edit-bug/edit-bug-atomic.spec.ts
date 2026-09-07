import { test, expect } from "../fixtures/boardPage.fixture";
import type { APIRequestContext } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type User = {
  username: string;
  password: string;
};

type Bug = {
  id: number;
  title: string;
  severity: string;
  owner: string;
  description: string;
  state: string;
};

const usersFile = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../users.json"
);
const users = JSON.parse(readFileSync(usersFile, "utf-8")) as User[];
const user = users[0];

async function createBug(request: APIRequestContext, title: string) {
  const response = await request.post("/api/bugs", {
    data: {
      title,
      severity: "HIGH",
      owner: user.username,
      description: "Description for the edit bug test.",
    },
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as Bug;
}

test.describe("Edit Bug", () => {
  test("opens the edit modal with persisted data and controls", async ({
    loginPage,
    boardPage,
    request,
  }) => {
    await loginPage.goto();
    await loginPage.login(user.username, user.password);
    const title = `Edit modal test ${Date.now()}`;
    const bug = await createBug(request, title);

    try {
      await boardPage.reload();
      await boardPage.openBugByRowName(
        new RegExp(`${bug.id} HIGH ${title} ${user.username}`)
      );

      const dialog = boardPage.editDialog();
      await expect(dialog).toBeVisible();
      await expect(boardPage.dialogField("ID")).toHaveValue(String(bug.id));
      await expect(boardPage.dialogField("Title")).toHaveValue(title);
      await expect(boardPage.dialogField("Severity")).toHaveValue("high");
      await expect(boardPage.dialogField("State")).toHaveValue("open");
      await expect(boardPage.dialogField("Owner")).toHaveValue(user.username);
      await expect(boardPage.dialogField("Description")).toHaveValue(
        bug.description
      );
      await expect(boardPage.dialogButton("Save")).toBeVisible();
      await expect(boardPage.dialogButton("Cancel")).toBeVisible();
      await expect(boardPage.dialogButton("Close")).toBeVisible();
      await expect(boardPage.dialogField("ID")).toHaveAttribute("readonly", "");
      await expect(boardPage.dialogField("Title")).not.toHaveAttribute(
        "readonly",
        ""
      );
      await expect(boardPage.dialogField("Severity")).toBeEnabled();
      await expect(boardPage.dialogField("Owner")).not.toHaveAttribute(
        "readonly",
        ""
      );
      await expect(boardPage.dialogField("Description")).not.toHaveAttribute(
        "readonly",
        ""
      );
    } finally {
      await request.delete(`/api/bugs/${bug.id}`);
    }
  });

  test("shows the severity options with matching color styling", async ({
    loginPage,
    boardPage,
    request,
  }) => {
    await loginPage.goto();
    await loginPage.login(user.username, user.password);
    const title = `Severity control test ${Date.now()}`;
    const bug = await createBug(request, title);

    try {
      await boardPage.reload();
      await boardPage.openBugByRowName(
        new RegExp(`${bug.id} HIGH ${title} ${user.username}`)
      );

      const dialog = boardPage.editDialog();
      const severity = boardPage.dialogField("Severity");
      await expect(severity.locator("option")).toHaveText([
        "HIGH",
        "MID",
        "LOW",
      ]);

      for (const [value, color] of [
        ["high", "rgb(184, 74, 46)"],
        ["mid", "rgb(166, 124, 71)"],
        ["low", "rgb(74, 107, 94)"],
      ]) {
        await severity.selectOption(value);
        await expect(severity).toHaveValue(value);
        await expect(severity).toHaveCSS("color", color);
      }

      await boardPage.dialogButton("Cancel").click();
      await expect(dialog).not.toBeVisible();
    } finally {
      await request.delete(`/api/bugs/${bug.id}`);
    }
  });
});
