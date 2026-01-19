import fs from "fs";
import path from "path";

const snapshotPath = path.resolve(process.cwd(), "storage", "sermons.json");

export const loadSermonSnapshot = (): unknown[] => {
  try {
    if (!fs.existsSync(snapshotPath)) {
      return [];
    }
    const raw = fs.readFileSync(snapshotPath, "utf-8");
    if (!raw.trim()) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Failed to read sermon snapshot.", error);
    return [];
  }
};

export const saveSermonSnapshot = (sermons: unknown[]): void => {
  try {
    fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
    fs.writeFileSync(snapshotPath, JSON.stringify(sermons, null, 2));
  } catch (error) {
    console.warn("Failed to write sermon snapshot.", error);
  }
};
