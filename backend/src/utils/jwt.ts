export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET is not configured.");
    }

    console.warn("JWT_SECRET is not set. Using development fallback secret.");
    return "dev-fallback-secret";
  }

  return secret;
};
