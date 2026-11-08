// CustomApplicationManager: validation + CRUD for user-added applications (pure list operations).
import { exeFromPath, isCriticalExe, type EligibleApp, type WorkloadCategory } from "./types";

export interface CustomAppInput {
  name: string;
  path: string;
  category: WorkloadCategory;
}

export function validateCustomApp(
  input: CustomAppInput,
  all: EligibleApp[],
  editingId?: string,
): string | null {
  const name = input.name.trim();
  const path = input.path.trim();
  if (!name) return "Enter an application name.";
  if (!path) return "Select the application's executable.";
  const exe = exeFromPath(path);
  if (!/\.exe$/i.test(exe)) return "The executable must be an .exe file.";
  if (isCriticalExe(exe)) return `${exe} is a critical Windows process and cannot be optimized.`;
  const dup = all.find((a) => a.id !== editingId && a.exe.toLowerCase() === exe.toLowerCase());
  if (dup) return `${exe} is already in the inventory as ${dup.name}.`;
  return null;
}

export function makeCustomApp(input: CustomAppInput, id: string): EligibleApp {
  const path = input.path.trim();
  return {
    id,
    name: input.name.trim(),
    path,
    exe: exeFromPath(path),
    category: input.category,
    source: "CUSTOM",
  };
}

export function addCustomApp(list: EligibleApp[], app: EligibleApp): EligibleApp[] {
  return [...list, app];
}

export function updateCustomApp(
  list: EligibleApp[],
  id: string,
  input: CustomAppInput,
): EligibleApp[] {
  return list.map((a) => (a.id === id ? makeCustomApp(input, id) : a));
}

export function deleteCustomApp(list: EligibleApp[], id: string): EligibleApp[] {
  return list.filter((a) => a.id !== id);
}

export function parseStoredCustomApps(raw: unknown): EligibleApp[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (a): a is EligibleApp =>
        !!a &&
        typeof a.id === "string" &&
        typeof a.name === "string" &&
        typeof a.path === "string" &&
        typeof a.exe === "string" &&
        ["GAMES", "CREATIVE", "VIDEO AI", "EMULATORS"].includes(a.category),
    )
    .map((a) => ({ ...a, source: "CUSTOM" as const }));
}
