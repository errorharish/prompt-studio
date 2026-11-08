// Pure rules for the Storage → Full File Explorer sample list (no real file access).
export const FILE_TYPES = [
  "Videos",
  "Images",
  "Audio",
  "Documents",
  "Applications",
  "Archives",
  "ISO",
  "Projects",
  "Other",
] as const;
export type FileType = (typeof FILE_TYPES)[number];

export const MIN_SIZES = ["Any size", "100 MB", "500 MB", "1 GB", "5 GB"] as const;
export const SORTS = ["Size", "Name", "Type", "Date Modified"] as const;

export interface SampleFile {
  name: string;
  path: string;
  sizeGb: number;
  type: FileType;
  modified: string; // ISO date
}

/** "500 MB" → 0.5 (GB); "Any size" → 0. */
export function minSizeGb(label: string): number {
  const m = /^([\d.]+)\s*(MB|GB)$/.exec(label);
  if (!m) return 0;
  return m[2] === "MB" ? Number(m[1]) / 1000 : Number(m[1]);
}

export interface FileFilter {
  drive: string; // "All drives" | "C:" | "D:"
  minimum: string;
  sort: string;
  /** Empty set = all types. */
  types: ReadonlySet<FileType>;
  query?: string | undefined;
}

export function filterFiles(files: readonly SampleFile[], f: FileFilter): SampleFile[] {
  const min = minSizeGb(f.minimum);
  const q = (f.query ?? "").trim().toLowerCase();
  return files
    .filter(
      (r) =>
        (f.types.size === 0 || f.types.has(r.type)) &&
        (f.drive === "All drives" || r.path.startsWith(f.drive)) &&
        r.sizeGb >= min &&
        (!q || r.name.toLowerCase().includes(q) || r.path.toLowerCase().includes(q)),
    )
    .sort((a, b) =>
      f.sort === "Name"
        ? a.name.localeCompare(b.name)
        : f.sort === "Type"
          ? a.type.localeCompare(b.type) || a.name.localeCompare(b.name)
          : f.sort === "Date Modified"
            ? b.modified.localeCompare(a.modified)
            : b.sizeGb - a.sizeGb,
    );
}
