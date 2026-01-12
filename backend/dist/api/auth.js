"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const databaseFallback_1 = require("../utils/databaseFallback");
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "bishramekatamandali@gmail.com").toLowerCase().trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "bishramekatamandali@15Done";
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || "Bishram Admin";
const router = express_1.default.Router();
async function generateUniqueUsername(baseUsername) {
    const sanitizedUsername = baseUsername?.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "") ||
        `user${Date.now()}`;
    let usernameCandidate = sanitizedUsername;
    let suffix = 1;
    while (await db_1.prisma.user.findUnique({ where: { username: usernameCandidate } })) {
        usernameCandidate = `${sanitizedUsername}${suffix++}`;
    }
    return usernameCandidate;
}
async function ensureDefaultAdmin() {
    try {
        const existingAdmin = await db_1.prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
        const hashed = await bcryptjs_1.default.hash(ADMIN_PASSWORD, 10);
        const adminUsername = existingAdmin
            ? existingAdmin.username
            : await generateUniqueUsername(ADMIN_EMAIL.split("@")[0]);
        await db_1.prisma.user.upsert({
            where: { email: ADMIN_EMAIL },
            update: {
                fullName: ADMIN_FULL_NAME,
                username: adminUsername,
                role: "admin",
                password: hashed,
                passwordHash: hashed,
            },
            create: {
                id: crypto_1.default.randomUUID(),
                fullName: ADMIN_FULL_NAME,
                email: ADMIN_EMAIL,
                username: adminUsername,
                role: "admin",
                password: hashed,
                passwordHash: hashed,
            },
        });
        if (!existingAdmin) {
            console.log("✅ Default admin account created for", ADMIN_EMAIL);
        }
    }
    catch (error) {
        console.error("❌ Failed to ensure default admin exists:", error);
    }
}
ensureDefaultAdmin();
/* ---------------------------------------------
   Helper: create JWT token
---------------------------------------------- */
function createToken(user) {
    return jsonwebtoken_1.default.sign({
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
    }, process.env.JWT_SECRET, { expiresIn: "7d" });
}
function sanitizeUser(user) {
    const { password, passwordHash, ...safeUser } = user;
    return safeUser;
}
/* ---------------------------------------------
   POST /api/auth/register
---------------------------------------------- */
router.post("/register", async (req, res) => {
    try {
        const { fullName, email, password, countryCode, phone } = req.body;
        if (!fullName || !email || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const normalizedEmail = email.toLowerCase().trim();
        const existing = await db_1.prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing) {
            return res.status(400).json({ error: "Email already exists" });
        }
        const hashed = await bcryptjs_1.default.hash(password, 10);
        const role = normalizedEmail === ADMIN_EMAIL ? "admin" : "user";
        const baseUsername = email?.split("@")[0]?.toLowerCase() ||
            fullName
                .toLowerCase()
                .replace(/\s+/g, "")
                .replace(/[^a-z0-9]/g, "");
        const usernameCandidate = await generateUniqueUsername(baseUsername);
        const phoneValue = (countryCode || "") + (phone || "");
        const user = await db_1.prisma.user.create({
            data: {
                id: crypto_1.default.randomUUID(),
                fullName,
                email: normalizedEmail,
                username: usernameCandidate,
                role,
                countryCode: countryCode ?? null,
                phone: phoneValue ? phoneValue.replace(/\s+/g, "") : null,
                // Store hashed password in password columns
                password: hashed,
                passwordHash: hashed,
            },
        });
        const token = createToken(user);
        res.json({ token, user: sanitizeUser(user) });
    }
    catch (error) {
        console.error("REGISTER ERROR:", error);
        if ((0, databaseFallback_1.handleDatabaseFallback)(req, res, error)) {
            return;
        }
        res.status(500).json({ error: "Internal error" });
    }
});
/* ---------------------------------------------
   POST /api/auth/login
---------------------------------------------- */
router.post("/login", async (req, res) => {
    try {
        const { identifier, email, password } = req.body;
        const loginIdentifier = (identifier || email || "").trim();
        if (!loginIdentifier || !password)
            return res.status(400).json({ error: "Missing identifier or password" });
        const normalizedEmail = loginIdentifier.includes("@")
            ? loginIdentifier.toLowerCase()
            : undefined;
        const normalizedPhone = loginIdentifier.replace(/\s+/g, "");
        const user = await db_1.prisma.user.findFirst({
            where: {
                OR: [
                    normalizedEmail ? { email: normalizedEmail } : undefined,
                    { username: loginIdentifier.toLowerCase() },
                    { phone: normalizedPhone },
                ].filter(Boolean),
            },
        });
        const storedPassword = user?.password || user?.passwordHash;
        if (!user || !storedPassword)
            return res.status(401).json({ error: "Invalid credentials" });
        const match = await bcryptjs_1.default.compare(password, storedPassword);
        if (!match)
            return res.status(401).json({ error: "Invalid credentials" });
        const token = createToken(user);
        console.log("LOGIN → token generated:", token.substring(0, 30) + "...");
        res.json({ token, user: sanitizeUser(user) });
    }
    catch (error) {
        console.error("LOGIN ERROR:", error);
        if ((0, databaseFallback_1.handleDatabaseFallback)(req, res, error)) {
            return;
        }
        res.status(500).json({ error: "Internal error" });
    }
});
/* ---------------------------------------------
   GET /api/auth/me  (protected)
---------------------------------------------- */
router.get("/me", auth_1.authMiddleware, async (req, res) => {
    try {
        const user = await db_1.prisma.user.findUnique({
            where: { id: req.user.id },
        });
        res.json({ user: user ? sanitizeUser(user) : null });
    }
    catch (error) {
        console.error("ME ERROR:", error);
        if ((0, databaseFallback_1.handleDatabaseFallback)(req, res, error)) {
            return;
        }
        res.status(500).json({ error: "Internal error" });
    }
});
exports.default = router;
