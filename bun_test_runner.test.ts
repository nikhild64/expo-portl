import { test, expect } from "bun:test";
import { spawnSync } from "child_process";

test("Jest Test Suite", () => {
  // Execute Jest via 'bun run test' to run the tests in the correct environment.
  // We use shell: true to support cross-platform execution (Windows/macOS/Linux).
  const result = spawnSync("bun", ["run", "test"], { stdio: "inherit", shell: true });
  expect(result.status).toBe(0);
}, 60000);
