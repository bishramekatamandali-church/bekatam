"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables first
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ override: true });
// --- Environment Variable Validation ---
const missingRequiredVars = [];
if (!process.env.DATABASE_URL) {
    missingRequiredVars.push("DATABASE_URL");
}
if (!process.env.JWT_SECRET) {
    missingRequiredVars.push("JWT_SECRET");
}
if (missingRequiredVars.length > 0) {
    console.error("❌ FATAL ERROR: Missing required environment variables.");
    missingRequiredVars.forEach((key) => console.error(`-> ${key} is missing.`));
    process.exit(1);
}
if (!process.env.FRONTEND_URL) {
    console.warn("⚠️ FRONTEND_URL is missing. Falling back to http://localhost:3000 for development.");
}
if (!process.env.API_KEY) {
    console.warn("⚠️ API_KEY is missing. AI tools will be unavailable.");
}
// --- End Environment Validation ---
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
// Import Routes
const sermons_1 = __importDefault(require("./api/sermons"));
const events_1 = __importDefault(require("./api/events"));
const ministries_1 = __importDefault(require("./api/ministries"));
const blogPosts_1 = __importDefault(require("./api/blogPosts"));
const newsItems_1 = __importDefault(require("./api/newsItems"));
const aboutSections_1 = __importDefault(require("./api/aboutSections"));
const keyPersons_1 = __importDefault(require("./api/keyPersons"));
const historyMilestones_1 = __importDefault(require("./api/historyMilestones"));
const historyChapters_1 = __importDefault(require("./api/historyChapters"));
const branchChurches_1 = __importDefault(require("./api/branchChurches"));
const comments_1 = __importDefault(require("./api/comments"));
const prayerRequests_1 = __importDefault(require("./api/prayerRequests"));
const testimonials_1 = __importDefault(require("./api/testimonials"));
const interactions_1 = __importDefault(require("./api/interactions"));
const aiTools_1 = __importDefault(require("./api/aiTools"));
const auth_1 = __importDefault(require("./api/auth"));
const contactMessages_1 = __importDefault(require("./api/contactMessages"));
const donationRecords_1 = __importDefault(require("./api/donationRecords"));
const donorLists_1 = __importDefault(require("./api/donorLists"));
const collectionRecords_1 = __importDefault(require("./api/collectionRecords"));
const ministryJoinRequests_1 = __importDefault(require("./api/ministryJoinRequests"));
const ministryMembers_1 = __importDefault(require("./api/ministryMembers"));
const users_1 = __importDefault(require("./api/users"));
const directMediaItems_1 = __importDefault(require("./api/directMediaItems"));
const advertisements_1 = __importDefault(require("./api/advertisements"));
const churchMembers_1 = __importDefault(require("./api/churchMembers"));
const meetingLogs_1 = __importDefault(require("./api/meetingLogs"));
const decisionLogs_1 = __importDefault(require("./api/decisionLogs"));
const expenseRecords_1 = __importDefault(require("./api/expenseRecords"));
const donatePage_1 = __importDefault(require("./api/donatePage"));
const financialSummary_1 = __importDefault(require("./api/financialSummary"));
const fellowshipSchedules_1 = __importDefault(require("./api/fellowshipSchedules"));
const activityLogs_1 = __importDefault(require("./api/activityLogs"));
const contentUpdates_1 = __importDefault(require("./api/contentUpdates"));
const notifications_1 = __importDefault(require("./api/notifications"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// --- Middlewares ---
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json({ limit: "10mb" }));
app.use("/api", (req, res, next) => {
    if (req.method === "GET" && !res.getHeader("Cache-Control")) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Surrogate-Control", "no-store");
    }
    next();
});
// --- CORS CONFIGURATION ---
// Allow multiple frontend origins (comma-separated) via FRONTEND_URL, and also allow same-origin / server-to-server requests.
const rawOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
const normalizeOrigin = (origin) => origin.replace(/\/$/, "");
const buildAllowedOrigins = (origins) => {
    const allowed = new Set();
    origins.forEach((origin) => {
        const normalized = normalizeOrigin(origin);
        if (!normalized)
            return;
        allowed.add(normalized);
        try {
            const url = new URL(normalized);
            if (["localhost", "127.0.0.1"].includes(url.hostname)) {
                return;
            }
            if (url.hostname.startsWith("www.")) {
                const nonWww = new URL(normalized);
                nonWww.hostname = url.hostname.replace(/^www\./, "");
                allowed.add(normalizeOrigin(nonWww.toString()));
            }
            else {
                const withWww = new URL(normalized);
                withWww.hostname = `www.${url.hostname}`;
                allowed.add(normalizeOrigin(withWww.toString()));
            }
        }
        catch (error) {
            console.warn("⚠️ Skipping invalid FRONTEND_URL origin:", origin);
        }
    });
    return allowed;
};
const allowedOrigins = buildAllowedOrigins(rawOrigins);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // No Origin header: curl, server-to-server, or same-origin.
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.has(origin))
            return callback(null, true);
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Disposition"],
}));
// Default route for quick server status check
app.get("/", (req, res) => {
    res.send("Bishram Ekata Mandali API Server is running!");
});
// --- API ROUTES ---
app.use("/api/sermons", sermons_1.default);
app.use("/api/events", events_1.default);
app.use("/api/ministries", ministries_1.default);
app.use("/api/blogposts", blogPosts_1.default);
app.use("/api/newsitems", newsItems_1.default);
app.use("/api/aboutsections", aboutSections_1.default);
app.use("/api/keypersons", keyPersons_1.default);
app.use("/api/historymilestones", historyMilestones_1.default);
app.use("/api/historychapters", historyChapters_1.default);
app.use("/api/branchchurches", branchChurches_1.default);
app.use("/api/comments", comments_1.default);
app.use("/api/prayer-requests", prayerRequests_1.default);
app.use("/api/testimonials", testimonials_1.default);
app.use("/api/interactions", interactions_1.default);
app.use("/api/ai-tools", aiTools_1.default);
app.use("/api/auth", auth_1.default);
app.use("/api/contact-messages", contactMessages_1.default);
app.use("/api/donation-records", donationRecords_1.default);
app.use("/api/donor-lists", donorLists_1.default);
app.use("/api/collection-records", collectionRecords_1.default);
app.use("/api/ministry-join-requests", ministryJoinRequests_1.default);
app.use("/api/ministry-members", ministryMembers_1.default);
app.use("/api/users", users_1.default);
app.use("/api/direct-media", directMediaItems_1.default);
app.use("/api/advertisements", advertisements_1.default);
app.use("/api/church-members", churchMembers_1.default);
app.use("/api/meeting-logs", meetingLogs_1.default);
app.use("/api/decision-logs", decisionLogs_1.default);
app.use("/api/expense-records", expenseRecords_1.default);
app.use("/api/donate-page", donatePage_1.default);
app.use("/api/financial-summary", financialSummary_1.default);
app.use("/api/fellowship-schedules", fellowshipSchedules_1.default);
app.use("/api/activity-logs", activityLogs_1.default);
app.use("/api/content-updates", contentUpdates_1.default);
app.use("/api/notifications", notifications_1.default);
// --- START SERVER ---
app.listen(port, () => {
    console.log(`🚀 Server is running at http://localhost:${port}`);
});
