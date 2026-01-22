import { Request, Response, NextFunction } from "express";
// Minimal placeholder payloads for content lists used on the public site.
export const fallbackPayloads: Record<string, unknown> = {
  sermons: [],  
  events: [],
  ministries: [],
  blogposts: [],
  newsitems: [],
  aboutsections: [],
  keypersons: [],
  historymilestones: [],
  historychapters: [],
  branchchurches: [],
  "direct-media": [],
  "prayer-requests": [],
  testimonials: [],
  "contact-messages": [],
  "donation-records": [],
  "collection-records": [],
  "ministry-join-requests": [],
};

export const resolveFallbackResource = (req: Request): string | null => {
  const baseParts = req.baseUrl.replace(/^\/+/, "").split("/").filter(Boolean);
  const pathParts = req.path.replace(/^\/+/, "").split("/").filter(Boolean);
  const resource = baseParts[0] === "api" ? baseParts[1] : baseParts[0];
  return resource || pathParts[0] || null;
};


/**
 * If the database is unavailable, short-circuit GET requests with a 200/empty
 * payload instead of letting Prisma surface 500 errors. This keeps the live
 * site usable (albeit without dynamic data) when MySQL is down.
 */
export const fallbackMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.method !== "GET") {
    return res.status(503).json({
      error: "Database unavailable. Write operations are temporarily disabled.",
    });
  }

  const resource = resolveFallbackResource(req);

  if (resource && resource in fallbackPayloads) {
    return res.status(200).json(fallbackPayloads[resource]);
  }

  return res.status(503).json({
    error: "Database unavailable and no fallback data for this endpoint.",
  });
};
