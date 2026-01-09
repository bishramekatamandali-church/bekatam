"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fallbackMiddleware = void 0;
// Minimal placeholder payloads for content lists used on the public site.
const fallbackPayloads = {
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
    "prayer-requests": [],
    testimonials: [],
    "donation-records": [],
    "collection-records": [],
    "ministry-join-requests": [],
};
/**
 * If the database is unavailable, short-circuit GET requests with a 200/empty
 * payload instead of letting Prisma surface 500 errors. This keeps the live
 * site usable (albeit without dynamic data) when MySQL is down.
 */
const fallbackMiddleware = (req, res, next) => {
    if (req.method !== "GET") {
        return res.status(503).json({
            error: "Database unavailable. Write operations are temporarily disabled.",
        });
    }
    const normalizedPath = req.path.replace(/^\/+/, "");
    const resource = normalizedPath.split("/")[0];
    if (resource in fallbackPayloads) {
        return res.status(200).json(fallbackPayloads[resource]);
    }
    return res.status(503).json({
        error: "Database unavailable and no fallback data for this endpoint.",
    });
};
exports.fallbackMiddleware = fallbackMiddleware;
