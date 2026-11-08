import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DEPLOYED_V2_ADDRESS, LEGACY_V1_ADDRESS } from "../lib/env";

const root = resolve(__dirname, "../..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("deployed v2 address", () => {
  it("is a well-formed address and is not the v1 deployment", () => {
    expect(DEPLOYED_V2_ADDRESS).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(DEPLOYED_V2_ADDRESS.toLowerCase()).not.toBe(LEGACY_V1_ADDRESS.toLowerCase());
  });

  it("is named in the README, the milestone, the changelog and .env.example", () => {
    for (const file of ["README.md", "docs/MILESTONE.md", "CHANGELOG.md", ".env.example"]) {
      expect(read(file)).toContain(DEPLOYED_V2_ADDRESS);
    }
  });
});
