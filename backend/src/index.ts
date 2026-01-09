// Load environment variables first
import dotenv from "dotenv";
dotenv.config();

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

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

// Import Routes
import sermonRoutes from "./api/sermons";
import eventRoutes from "./api/events";
import chatbotRoutes from "./api/chatbot";
import ministryRoutes from "./api/ministries";
import blogPostRoutes from "./api/blogPosts";
import newsItemRoutes from "./api/newsItems";
import aboutSectionRoutes from "./api/aboutSections";
import keyPersonRoutes from "./api/keyPersons";
import historyMilestoneRoutes from "./api/historyMilestones";
import historyChapterRoutes from "./api/historyChapters";
import branchChurchRoutes from "./api/branchChurches";
import commentRoutes from "./api/comments";
import prayerRequestRoutes from "./api/prayerRequests";
import testimonialRoutes from "./api/testimonials";
import interactionRoutes from "./api/interactions";
import aiToolsRoutes from "./api/aiTools";
import authRoutes from "./api/auth";
import contactMessageRoutes from "./api/contactMessages";
import donationRecordRoutes from "./api/donationRecords";
import collectionRecordRoutes from "./api/collectionRecords";
import ministryJoinRequestRoutes from "./api/ministryJoinRequests";
import userRoutes from "./api/users";
import friendshipRoutes from "./api/friendships";
import groupRoutes from "./api/groups";
import directMediaItemRoutes from "./api/directMediaItems";
import advertisementRoutes from "./api/advertisements";
import churchMemberRoutes from "./api/churchMembers";
import meetingLogRoutes from "./api/meetingLogs";
import decisionLogRoutes from "./api/decisionLogs";
import expenseRecordRoutes from "./api/expenseRecords";
import donatePageRoutes from "./api/donatePage";
import financialSummaryRoutes from "./api/financialSummary";
import fellowshipScheduleRoutes from "./api/fellowshipSchedules";
import activityLogRoutes from "./api/activityLogs";
import contentUpdateRoutes from "./api/contentUpdates";

const app = express();
const port = process.env.PORT || 3001;

// --- Middlewares ---
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));
app.use(express.json());

// --- CORS CONFIGURATION ---
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Default route for quick server status check
app.get("/", (req, res) => {
  res.send("Bishram Ekata Mandali API Server is running!");
});

// --- API ROUTES ---
app.use("/api/sermons", sermonRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/ministries", ministryRoutes);
app.use("/api/blogposts", blogPostRoutes);
app.use("/api/newsitems", newsItemRoutes);
app.use("/api/aboutsections", aboutSectionRoutes);
app.use("/api/keypersons", keyPersonRoutes);
app.use("/api/historymilestones", historyMilestoneRoutes);
app.use("/api/historychapters", historyChapterRoutes);
app.use("/api/branchchurches", branchChurchRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/prayer-requests", prayerRequestRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/interactions", interactionRoutes);
app.use("/api/ai-tools", aiToolsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/contact-messages", contactMessageRoutes);
app.use("/api/donation-records", donationRecordRoutes);
app.use("/api/collection-records", collectionRecordRoutes);
app.use("/api/ministry-join-requests", ministryJoinRequestRoutes);
app.use("/api/users", userRoutes);
app.use("/api/friendships", friendshipRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/direct-media", directMediaItemRoutes);
app.use("/api/advertisements", advertisementRoutes);
app.use("/api/church-members", churchMemberRoutes);
app.use("/api/meeting-logs", meetingLogRoutes);
app.use("/api/decision-logs", decisionLogRoutes);
app.use("/api/expense-records", expenseRecordRoutes);
app.use("/api/donate-page", donatePageRoutes);
app.use("/api/financial-summary", financialSummaryRoutes);
app.use("/api/fellowship-schedules", fellowshipScheduleRoutes);
app.use("/api/activity-logs", activityLogRoutes);
app.use("/api/content-updates", contentUpdateRoutes);

// --- START SERVER ---
app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
