"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fallbackMiddleware = exports.resolveFallbackResource = exports.fallbackPayloads = void 0;
// Minimal placeholder payloads for content lists used on the public site.
exports.fallbackPayloads = {
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
const resolveFallbackResource = (req) => {
    const baseParts = req.baseUrl.replace(/^\/+/, "").split("/").filter(Boolean);
    const pathParts = req.path.replace(/^\/+/, "").split("/").filter(Boolean);
    const resource = baseParts[0] === "api" ? baseParts[1] : baseParts[0];
    return resource || pathParts[0] || null;
};
exports.resolveFallbackResource = resolveFallbackResource;
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
    const resource = (0, exports.resolveFallbackResource)(req);
    if (resource && resource in exports.fallbackPayloads) {
        return res.status(200).json(exports.fallbackPayloads[resource]);
    }
    return res.status(503).json({
        error: "Database unavailable and no fallback data for this endpoint.",
    });
};
exports.fallbackMiddleware = fallbackMiddleware;
