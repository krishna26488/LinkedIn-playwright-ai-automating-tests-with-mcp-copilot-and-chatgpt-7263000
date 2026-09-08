import { expect, test, type APIRequestContext, type APIResponse } from "@playwright/test";
import { randomUUID } from "node:crypto";

interface Bug {
  id: number;
  title: string;
  severity: "HIGH" | "MID" | "LOW";
  owner: string;
  description: string;
  state: "OPEN" | "CLOSED";
}

const validCredentials = { username: "buggy", password: "1970beetle" };

function uniqueTitle(prefix: string): string {
  return `${prefix} ${randomUUID()}`;
}

async function createBug(
  request: APIRequestContext,
  overrides: Partial<Pick<Bug, "title" | "severity" | "owner" | "description">> = {}
): Promise<Bug> {
  const response = await request.post("/api/bugs", {
    data: {
      title: uniqueTitle("API test bug"),
      severity: "HIGH",
      owner: "buggy",
      description: "Created by an API test.",
      ...overrides,
    },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as Bug;
}

async function deleteIfPresent(
  request: APIRequestContext,
  bugId: number | undefined
): Promise<void> {
  if (bugId === undefined) return;
  const response = await request.delete(`/api/bugs/${bugId}`);
  expect([204, 404]).toContain(response.status());
}

async function expectError(
  response: APIResponse,
  status: number,
  error: string,
  message: string
): Promise<void> {
  expect(response.status()).toBe(status);
  await expect(response.json()).resolves.toEqual({ error, message });
}

test.describe("REST API", () => {
  test("GET /api/health reports a healthy API and database", async ({ request }) => {
    const response = await request.get("/api/health");

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      message: "BuggyBoard API is running",
      database: "connected",
    });
    expect(response.headers()["content-type"]).toContain("application/json");
  });

  test("POST /api/login accepts valid credentials without exposing the password", async ({ request }) => {
    const response = await request.post("/api/login", { data: validCredentials });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ username: "buggy" });
    expect(body).not.toHaveProperty("password");
  });

  test("POST /api/login trims a valid username", async ({ request }) => {
    const response = await request.post("/api/login", {
      data: { username: "  buggy  ", password: validCredentials.password },
    });

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual({ username: "buggy" });
  });

  for (const scenario of [
    {
      name: "missing credentials",
      data: {},
      status: 400,
      error: "missing_credentials",
      message: "Please enter your username and password.",
    },
    {
      name: "blank username",
      data: { username: "   ", password: validCredentials.password },
      status: 400,
      error: "blank_username",
      message: "Username cannot be blank.",
    },
    {
      name: "blank password",
      data: { username: validCredentials.username, password: "" },
      status: 400,
      error: "blank_password",
      message: "Password cannot be blank.",
    },
    {
      name: "unknown username",
      data: { username: "not-a-user", password: validCredentials.password },
      status: 401,
      error: "invalid_credentials",
      message: "Invalid username or password.",
    },
    {
      name: "incorrect password",
      data: { username: validCredentials.username, password: "wrong-password" },
      status: 401,
      error: "invalid_credentials",
      message: "Invalid username or password.",
    },
  ]) {
    test(`POST /api/login rejects ${scenario.name}`, async ({ request }) => {
      const response = await request.post("/api/login", { data: scenario.data });
      await expectError(response, scenario.status, scenario.error, scenario.message);
    });
  }

  test("POST /api/login rejects non-string credentials without a server error", async ({ request }) => {
    const response = await request.post("/api/login", {
      data: { username: null, password: null },
    });

    expect(response.status()).toBe(400);
    expect(response.status()).not.toBe(500);
  });

  test("GET /api/bugs returns bugs ordered by ascending ID", async ({ request }) => {
    const bugIds: number[] = [];
    try {
      const first = await createBug(request, { title: uniqueTitle("API list first") });
      const second = await createBug(request, { title: uniqueTitle("API list second") });
      bugIds.push(first.id, second.id);

      const response = await request.get("/api/bugs");
      expect(response.status()).toBe(200);
      const bugs = (await response.json()) as Bug[];
      expect(Array.isArray(bugs)).toBe(true);
      expect(bugs).toEqual([...bugs].sort((a, b) => a.id - b.id));
      expect(bugs.find((bug) => bug.id === first.id)).toMatchObject(first);
      expect(bugs.find((bug) => bug.id === second.id)).toMatchObject(second);
    } finally {
      await deleteIfPresent(request, secondId(bugIds));
      await deleteIfPresent(request, bugIds[0]);
    }
  });

  test("PATCH /api/bugs is rejected without mutating the bug list", async ({ request }) => {
    const before = await request.get("/api/bugs");
    const beforeBody = await before.json();
    const response = await request.patch("/api/bugs", { data: {} });
    const after = await request.get("/api/bugs");

    expect(response.status()).toBe(404);
    await expect(after.json()).resolves.toEqual(beforeBody);
  });

  for (const scenario of [
    { field: "title", value: "", error: "blank_title", message: "Title is required." },
    { field: "title", value: "   ", error: "blank_title", message: "Title is required." },
    {
      field: "severity",
      value: "critical",
      error: "blank_severity",
      message: "Severity is required (high, mid, or low).",
    },
    { field: "severity", value: "", error: "blank_severity", message: "Severity is required (high, mid, or low)." },
    { field: "owner", value: "   ", error: "blank_owner", message: "Owner is required." },
    { field: "description", value: "", error: "blank_description", message: "Description is required." },
  ]) {
    test(`POST /api/bugs rejects invalid ${scenario.field} (${scenario.value || "missing value"})`, async ({ request }) => {
      const payload = {
        title: uniqueTitle("API invalid create"),
        severity: "HIGH",
        owner: "buggy",
        description: "Valid description.",
        [scenario.field]: scenario.value,
      };
      const response = await request.post("/api/bugs", { data: payload });
      await expectError(response, 400, scenario.error, scenario.message);
    });
  }

  test("POST /api/bugs creates and persists a bug", async ({ request }) => {
    let bugId: number | undefined;
    const title = uniqueTitle("API create");
    try {
      const response = await request.post("/api/bugs", {
        data: {
          title,
          severity: "HIGH",
          owner: "buggy",
          description: "Created by the API test.",
        },
      });
      expect(response.status()).toBe(201);
      const bug = (await response.json()) as Bug;
      bugId = bug.id;
      expect(bug).toMatchObject({ title, severity: "HIGH", owner: "buggy", state: "OPEN" });

      const persisted = await request.get(`/api/bugs/${bugId}`);
      expect(persisted.status()).toBe(200);
      await expect(persisted.json()).resolves.toEqual(bug);
    } finally {
      await deleteIfPresent(request, bugId);
    }
  });

  test("POST /api/bugs normalizes severity and trims text fields", async ({ request }) => {
    const bugIds: number[] = [];
    try {
      for (const [severity, expected] of [["high", "HIGH"], ["MiD", "MID"], ["low", "LOW"]]) {
        const bug = await createBug(request, {
          title: `  ${uniqueTitle("API normalization")}  `,
          severity,
          owner: "  buggy  ",
          description: "  trimmed description  ",
        });
        bugIds.push(bug.id);
        expect(bug.severity).toBe(expected);
        expect(bug.owner).toBe("buggy");
        expect(bug.description).toBe("trimmed description");
      }
    } finally {
      for (const bugId of bugIds) await deleteIfPresent(request, bugId);
    }
  });

  test("GET /api/bugs/:id returns an existing bug", async ({ request }) => {
    let bugId: number | undefined;
    try {
      const created = await createBug(request);
      bugId = created.id;
      const response = await request.get(`/api/bugs/${bugId}`);
      expect(response.status()).toBe(200);
      await expect(response.json()).resolves.toEqual(created);
    } finally {
      await deleteIfPresent(request, bugId);
    }
  });

  for (const method of ["get", "put", "delete"] as const) {
    test(`${method.toUpperCase()} /api/bugs/:id rejects a non-numeric ID`, async ({ request }) => {
      const response = await request[method](`/api/bugs/not-a-number`, method === "put" ? {
        data: { title: "Valid", severity: "HIGH", owner: "buggy", description: "Valid", state: "OPEN" },
      } : undefined);
      await expectError(response, 400, "invalid_id", "Bug ID must be a number.");
    });
  }

  test("GET /api/bugs/:id returns not found for an unknown ID", async ({ request }) => {
    const response = await request.get("/api/bugs/999999999");
    await expectError(response, 404, "not_found", "Bug not found.");
  });

  test("POST /api/bugs rejects non-string fields", async ({ request }) => {
    const response = await request.post("/api/bugs", {
      data: { title: 42, severity: ["HIGH"], owner: null, description: {} },
    });
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toBe("blank_title");
  });

  test("PUT /api/bugs/:id updates all fields and persists the changes", async ({ request }) => {
    let bugId: number | undefined;
    try {
      const created = await createBug(request);
      bugId = created.id;
      const response = await request.put(`/api/bugs/${bugId}`, {
        data: {
          title: uniqueTitle("API update"),
          severity: "low",
          owner: "vanny",
          description: "Updated by the API test.",
          state: "closed",
        },
      });
      expect(response.status()).toBe(200);
      const updated = (await response.json()) as Bug;
      expect(updated).toMatchObject({ id: bugId, severity: "LOW", owner: "vanny", state: "CLOSED" });

      const persisted = await request.get(`/api/bugs/${bugId}`);
      await expect(persisted.json()).resolves.toEqual(updated);
    } finally {
      await deleteIfPresent(request, bugId);
    }
  });

  for (const [severity, state] of [["HIGH", "open"], ["mid", "CLOSED"], ["Low", "Open"]]) {
    test(`PUT /api/bugs/:id accepts severity ${severity} and state ${state}`, async ({ request }) => {
      let bugId: number | undefined;
      try {
        bugId = (await createBug(request)).id;
        const response = await request.put(`/api/bugs/${bugId}`, {
          data: { title: uniqueTitle("API state update"), severity, owner: "buggy", description: "Valid", state },
        });
        expect(response.status()).toBe(200);
        const updated = (await response.json()) as Bug;
        expect(["HIGH", "MID", "LOW"]).toContain(updated.severity);
        expect(["OPEN", "CLOSED"]).toContain(updated.state);
      } finally {
        await deleteIfPresent(request, bugId);
      }
    });
  }

  for (const scenario of [
    { field: "title", value: "", error: "blank_title", message: "Title is required." },
    { field: "severity", value: "critical", error: "blank_severity", message: "Severity is required (high, mid, or low)." },
    { field: "owner", value: "", error: "blank_owner", message: "Owner is required." },
    { field: "description", value: "", error: "blank_description", message: "Description is required." },
    { field: "state", value: "pending", error: "invalid_state", message: "State must be Open or Closed." },
  ]) {
    test(`PUT /api/bugs/:id rejects invalid ${scenario.field}`, async ({ request }) => {
      let bugId: number | undefined;
      let original: Bug | undefined;
      try {
        original = await createBug(request);
        bugId = original.id;
        const payload = {
          title: original.title,
          severity: original.severity,
          owner: original.owner,
          description: original.description,
          state: original.state,
          [scenario.field]: scenario.value,
        };
        const response = await request.put(`/api/bugs/${bugId}`, { data: payload });
        await expectError(response, 400, scenario.error, scenario.message);
        const unchanged = await request.get(`/api/bugs/${bugId}`);
        await expect(unchanged.json()).resolves.toEqual(original);
      } finally {
        await deleteIfPresent(request, bugId);
      }
    });
  }

  test("PUT /api/bugs/:id returns not found for an unknown ID", async ({ request }) => {
    const response = await request.put("/api/bugs/999999999", {
      data: { title: "Valid", severity: "HIGH", owner: "buggy", description: "Valid", state: "OPEN" },
    });
    await expectError(response, 404, "not_found", "Bug not found.");
  });

  test("DELETE /api/bugs/:id deletes a bug and returns no content", async ({ request }) => {
    const created = await createBug(request);
    const response = await request.delete(`/api/bugs/${created.id}`);
    expect(response.status()).toBe(204);
    expect(await response.body()).toHaveLength(0);

    const fetched = await request.get(`/api/bugs/${created.id}`);
    await expectError(fetched, 404, "not_found", "Bug not found.");
  });

  test("DELETE /api/bugs/:id returns not found when repeated", async ({ request }) => {
    const created = await createBug(request);
    try {
      const first = await request.delete(`/api/bugs/${created.id}`);
      expect(first.status()).toBe(204);
      const second = await request.delete(`/api/bugs/${created.id}`);
      await expectError(second, 404, "not_found", "Bug not found.");
    } finally {
      await deleteIfPresent(request, created.id);
    }
  });

  test("DELETE /api/bugs/:id returns not found for an unknown ID", async ({ request }) => {
    const response = await request.delete("/api/bugs/999999999");
    await expectError(response, 404, "not_found", "Bug not found.");
  });

  test("malformed JSON is rejected without crashing the API", async ({ request }) => {
    const response = await request.post("/api/bugs", {
      data: '{"title":',
      headers: { "Content-Type": "application/json" },
    });
    expect(response.status()).toBe(400);
    expect(response.status()).not.toBe(500);
  });

  test("bug endpoints are callable without an authentication token", async ({ request }) => {
    const response = await request.get("/api/bugs");
    expect(response.status()).toBe(200);
  });
});

function secondId(ids: number[]): number | undefined {
  return ids[1];
}
