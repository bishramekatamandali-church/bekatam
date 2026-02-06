
import crypto from "crypto";

/**
 * generateId()
 * - Uses crypto.randomUUID when available (Node 14.17+).
 * - Falls back to 32-hex random bytes for older runtimes.
 */
export const generateId = (): string => {
  const anyCrypto: any = crypto as any;
  if (typeof anyCrypto.randomUUID === "function") return anyCrypto.randomUUID();
  return crypto.randomBytes(16).toString("hex");
};
