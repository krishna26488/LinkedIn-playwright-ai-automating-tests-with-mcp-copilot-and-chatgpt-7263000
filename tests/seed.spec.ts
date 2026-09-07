import { test } from "./fixtures/loginPage.fixture";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type User = {
  username: string;
  password: string;
};

const usersFile = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../users.json"
);
const users = JSON.parse(readFileSync(usersFile, "utf-8")) as User[];
const user = users[0];

test(
  "logs into BuggyBoard with the first user",
  { tag: "@seed" },
  async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(user.username, user.password);
  }
);
