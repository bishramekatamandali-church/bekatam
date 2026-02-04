// Load environment variables first
import dotenv from "dotenv";
dotenv.config({ override: true });


// --- Environment Variable Validation ---
const missingRequiredVars: string[] = [];
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

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

// Import Routes
import sermonRoutes from "./api/sermons";
import eventRoutes from "./api/events";
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
import donorListRoutes from "./api/donorLists";
import collectionRecordRoutes from "./api/collectionRecords";
import ministryJoinRequestRoutes from "./api/ministryJoinRequests";
import ministryMemberRoutes from "./api/ministryMembers";
import userRoutes from "./api/users";
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
import notificationRoutes from "./api/notifications";
import pdfRoutes from "./routes/pdfRoutes";

const app = express();
const port = process.env.PORT || 3001;

// --- Middlewares ---
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));

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

  const normalizeOrigin = (origin: string) => origin.replace(/\/$/, "");

const buildAllowedOrigins = (origins: string[]) => {
  const allowed = new Set<string>();

  origins.forEach((origin) => {
    const normalized = normalizeOrigin(origin);
    if (!normalized) return;
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
      } else {
        const withWww = new URL(normalized);
        withWww.hostname = `www.${url.hostname}`;
        allowed.add(normalizeOrigin(withWww.toString()));
      }
    } catch (error) {
      console.warn("⚠️ Skipping invalid FRONTEND_URL origin:", origin);
    }
  });

  return allowed;
};

const allowedOrigins = buildAllowedOrigins(rawOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // No Origin header: curl, server-to-server, or same-origin.
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Disposition"],
  })
);

app.use("/api/pdfs", pdfRoutes);

// Default route for quick server status check
app.get("/", (req, res) => {
  res.send("Bishram Ekata Mandali API Server is running!");
});

// --- API ROUTES ---
app.use("/api/sermons", sermonRoutes);
app.use("/api/events", eventRoutes);
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
app.use("/api/donor-lists", donorListRoutes);
app.use("/api/collection-records", collectionRecordRoutes);
app.use("/api/ministry-join-requests", ministryJoinRequestRoutes);
app.use("/api/ministry-members", ministryMemberRoutes);
app.use("/api/users", userRoutes);
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
app.use("/api/notifications", notificationRoutes);

// --- START SERVER ---
app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
}); 
