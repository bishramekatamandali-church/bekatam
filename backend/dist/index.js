"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables first
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// --- Environment Variable Validation ---
if (!process.env.GEMINI_API_KEY || !process.env.DATABASE_URL || !process.env.FRONTEND_URL) {
    console.error("❌ FATAL ERROR: Missing required environment variables.");
    if (!process.env.GEMINI_API_KEY)
        console.error("-> GEMINI_API_KEY is missing. Please add it to backend/.env");
    if (!process.env.DATABASE_URL)
        console.error("-> DATABASE_URL is missing.");
    if (!process.env.FRONTEND_URL)
        console.error("-> FRONTEND_URL is missing. Should be http://localhost:3000 for development.");
    process.exit(1);
}
// --- End Environment Validation ---
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
// Import Routes
const fallbackMiddleware_1 = require("./middleware/fallbackMiddleware");
const db_1 = require("./db");
const sermons_1 = __importDefault(require("./api/sermons"));
const events_1 = __importDefault(require("./api/events"));
const chatbot_1 = __importDefault(require("./api/chatbot"));
const ministries_1 = __importDefault(require("./api/ministries"));
const blogPosts_1 = __importDefault(require("./api/blogPosts"));
const newsItems_1 = __importDefault(require("./api/newsItems"));
const homeSlides_1 = __importDefault(require("./api/homeSlides"));
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
const collectionRecords_1 = __importDefault(require("./api/collectionRecords"));
const ministryJoinRequests_1 = __importDefault(require("./api/ministryJoinRequests"));
const users_1 = __importDefault(require("./api/users"));
const friendships_1 = __importDefault(require("./api/friendships"));
const groups_1 = __importDefault(require("./api/groups"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// Attempt database connection early and fall back to static responses if it fails
(0, db_1.initDatabase)();
// --- Middlewares ---
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use("/api", fallbackMiddleware_1.fallbackMiddleware);
// --- CORS CONFIGURATION ---
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
// Default route for quick server status check
app.get("/", (req, res) => {
    res.send("Bishram Ekata Mandali API Server is running!");
});
// --- API ROUTES ---
app.use("/api/sermons", sermons_1.default);
app.use("/api/events", events_1.default);
app.use("/api/chatbot", chatbot_1.default);
app.use("/api/ministries", ministries_1.default);
app.use("/api/blogposts", blogPosts_1.default);
app.use("/api/newsitems", newsItems_1.default);
app.use("/api/homeslides", homeSlides_1.default);
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
app.use("/api/collection-records", collectionRecords_1.default);
app.use("/api/ministry-join-requests", ministryJoinRequests_1.default);
app.use("/api/users", users_1.default);
app.use("/api/friendships", friendships_1.default);
app.use("/api/groups", groups_1.default);
// --- START SERVER ---
app.listen(port, () => {
    console.log(`🚀 Server is running at http://localhost:${port}`);
});
