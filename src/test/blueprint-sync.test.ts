import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DEPTH, MOTION } from "@/lib/eo/blueprint";
import { PAGES } from "@/lib/eo/registry";
import { ICONS } from "@/components/eo/icons";

const css = readFileSync(resolve(__dirname, "../styles.css"), "utf8");

describe("Blueprint stays in sync with the running prototype", () => {
  it("documents only motion values that exist in styles.css", () => {
    for (const m of MOTION) expect(css, m.name).toContain(m.css);
  });
  it("documents only depth tokens that exist in styles.css", () => {
    for (const d of DEPTH) expect(css, d.name).toContain(d.css);
  });
  it("has an icon for every registered page", () => {
    for (const p of PAGES) expect(ICONS[p.icon], p.routeKey).toBeDefined();
  });
});
