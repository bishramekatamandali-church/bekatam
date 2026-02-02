import path from "path";

export const fontPaths = () => {
  // This resolves to backend/dist/... at runtime after build
  const base = path.join(__dirname, "..", "..", "..", "assets", "fonts");

  return {
    latinRegular: path.join(base, "NotoSans-Regular.ttf"),
    latinBold: path.join(base, "NotoSans-Bold.ttf"),
    devRegular: path.join(base, "NotoSansDevanagari-Regular.ttf"),
    devBold: path.join(base, "NotoSansDevanagari-Bold.ttf"),
  };
};

// Simple script detector for Devanagari range
export const isDevanagariChar = (ch: string) => {
  const code = ch.codePointAt(0) ?? 0;
  return code >= 0x0900 && code <= 0x097F;
};

export type Run = { text: string; script: "dev" | "latin" };

export const splitRunsByScript = (text: string): Run[] => {
  const out: Run[] = [];
  let buf = "";
  let cur: "dev" | "latin" | null = null;

  for (const ch of text ?? "") {
    const script: "dev" | "latin" = isDevanagariChar(ch) ? "dev" : "latin";
    if (cur === null) {
      cur = script;
      buf = ch;
    } else if (script === cur) {
      buf += ch;
    } else {
      out.push({ text: buf, script: cur });
      cur = script;
      buf = ch;
    }
  }
  if (buf) out.push({ text: buf, script: cur ?? "latin" });
  return out;
};
