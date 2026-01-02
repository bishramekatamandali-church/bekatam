// Centralized API base URL so all fetch calls use the same source.
// Defaults to a relative /api path that is proxied to the backend during development.
const rawApiBase = import.meta.env.VITE_API_BASE_URL || "/api";

export const API_BASE_URL = rawApiBase.replace(/\/$/, "");
