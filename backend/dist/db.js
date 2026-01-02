"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = exports.isDatabaseHealthy = exports.prisma = void 0;
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient();
/**
 * Tracks whether a live database connection is available. When false, the
 * API layer can fall back to static responses instead of surfacing 500s.
 */
exports.isDatabaseHealthy = false;
const HEALTH_CHECK_INTERVAL_MS = Number(process.env.DB_HEALTH_CHECK_INTERVAL_MS ?? "30000");
const updateHealthStatus = (healthy, error) => {
    if (healthy === exports.isDatabaseHealthy) {
        // Avoid noisy logs when the status has not changed
        if (!healthy && error) {
            console.error("⚠️  Database still unreachable. Operating in fallback mode.", error);
        }
        return;
    }
    exports.isDatabaseHealthy = healthy;
    if (healthy) {
        console.log("✅ Database connection established");
    }
    else {
        console.error("⚠️  Lost database connection. Serving fallback data.", error);
    }
};
const probeDatabase = async () => {
    try {
        await exports.prisma.$connect();
        await exports.prisma.$queryRaw `SELECT 1`;
        updateHealthStatus(true);
    }
    catch (error) {
        updateHealthStatus(false, error);
    }
};
/**
 * Attempt an early connection to the database so we know whether to operate in
 * full or fallback mode. Errors are logged but swallowed so the server can
 * still start and serve cached/static responses.
 * A periodic health check keeps trying to reconnect if the initial attempt
 * fails, allowing the API to recover automatically when the database returns.
 */
const initDatabase = async () => {
    await probeDatabase();
    setInterval(() => {
        probeDatabase().catch((error) => console.error("⚠️  Database health check failed:", error));
    }, HEALTH_CHECK_INTERVAL_MS);
};
exports.initDatabase = initDatabase;
