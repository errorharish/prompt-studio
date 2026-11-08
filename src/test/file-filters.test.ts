import { describe, expect, it } from "vitest";
import { filterFiles, minSizeGb, type SampleFile } from "@/lib/eo/fileFilters";

const files: SampleFile[] = [
  { name: "b.mp4", path: "D:\\V", sizeGb: 8, type: "Videos", modified: "2026-01-01" },
  { name: "a.iso", path: "D:\\I", sizeGb: 5, type: "ISO", modified: "2026-03-01" },
  { name: "c.zip", path: "C:\\U", sizeGb: 0.3, type: "Archives", modified: "2026-02-01" },
];
const base = { drive: "All drives", minimum: "Any size", sort: "Size", types: new Set<never>() };

describe("file explorer filters", () => {
  it("parses size thresholds", () => {
    expect(minSizeGb("500 MB")).toBe(0.5);
    expect(minSizeGb("1 GB")).toBe(1);
    expect(minSizeGb("Any size")).toBe(0);
  });
  it("empty type selection shows all; multi-select keeps only chosen types", () => {
    expect(filterFiles(files, base)).toHaveLength(3);
    const r = filterFiles(files, { ...base, types: new Set(["ISO", "Archives"] as const) });
    expect(r.map((f) => f.name).sort()).toEqual(["a.iso", "c.zip"]);
  });
  it("applies drive, minimum size and search", () => {
    expect(filterFiles(files, { ...base, drive: "C:" }).map((f) => f.name)).toEqual(["c.zip"]);
    expect(filterFiles(files, { ...base, minimum: "1 GB" })).toHaveLength(2);
    expect(filterFiles(files, { ...base, query: "MP4" }).map((f) => f.name)).toEqual(["b.mp4"]);
  });
  it("sorts by size, name, type and date", () => {
    expect(filterFiles(files, base)[0]?.name).toBe("b.mp4");
    expect(filterFiles(files, { ...base, sort: "Name" })[0]?.name).toBe("a.iso");
    expect(filterFiles(files, { ...base, sort: "Type" })[0]?.type).toBe("Archives");
    expect(filterFiles(files, { ...base, sort: "Date Modified" })[0]?.name).toBe("a.iso");
  });
});
