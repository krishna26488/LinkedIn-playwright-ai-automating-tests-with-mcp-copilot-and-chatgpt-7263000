import { test, expect } from "../fixtures/boardPage.fixture";
import { readFileSync } from "fs";
import { join } from "path";

interface User {
  username: string;
  password: string;
}

test.describe("Create Bug - Open create-bug modal from board", () => {
  test("should open the create-bug modal from the board page", async ({
    loginPage,
    boardPage,
  }) => {
    const usersPath = join(process.cwd(), "users.json");
    const rawUsers = readFileSync(usersPath, "utf-8");
    const users = JSON.parse(rawUsers) as User[];
    const firstUser = users[0];

    await loginPage.goto();
    await loginPage.login(firstUser.username, firstUser.password);

    await expect(boardPage.logoutButton).toBeVisible();
    await expect(boardPage.newBugButton).toBeVisible();

    await boardPage.openCreateBug();
    const dialog = boardPage.createBugDialog();

    await expect(dialog).toBeVisible();
    await expect(boardPage.dialogField("Title")).toBeVisible();
    await expect(boardPage.dialogField("Severity")).toBeVisible();
    await expect(boardPage.dialogField("Owner")).toBeVisible();
    await expect(boardPage.dialogField("Description")).toBeVisible();
    await expect(boardPage.dialogButton("Save")).toBeVisible();
    await expect(boardPage.dialogButton("Cancel")).toBeVisible();
  });
});
