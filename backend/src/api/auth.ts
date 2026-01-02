import crypto from "crypto";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { authMiddleware } from "../middleware/auth";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "bishramekatamandali@gmail.com").toLowerCase().trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "bishramekatamandali@15Done";
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || "Bishram Admin";

const router = express.Router();

async function generateUniqueUsername(baseUsername?: string) {
  const sanitizedUsername =
    baseUsername?.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "") ||
    `user${Date.now()}`;

  let usernameCandidate = sanitizedUsername;
  let suffix = 1;

  while (await prisma.user.findUnique({ where: { username: usernameCandidate } })) {
    usernameCandidate = `${sanitizedUsername}${suffix++}`;
  }

  return usernameCandidate;
}

async function ensureDefaultAdmin() {
  try {
    const existingAdmin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const adminUsername = existingAdmin
      ? existingAdmin.username
      : await generateUniqueUsername(ADMIN_EMAIL.split("@")[0]);

    await prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      update: {
        fullName: ADMIN_FULL_NAME,
        username: adminUsername,
        role: "admin",
        password: hashed as any,
        passwordHash: hashed as any,
      },
      create: {
        id: crypto.randomUUID(),
        fullName: ADMIN_FULL_NAME,
        email: ADMIN_EMAIL,
        username: adminUsername,
        role: "admin",
        password: hashed as any,
        passwordHash: hashed as any,
      },
    });

    if (!existingAdmin) {
      console.log("✅ Default admin account created for", ADMIN_EMAIL);
    }
  } catch (error) {
    console.error("❌ Failed to ensure default admin exists:", error);
  }
}

ensureDefaultAdmin();

/* ---------------------------------------------
   Helper: create JWT token
---------------------------------------------- */
function createToken(user: any) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );
}

function sanitizeUser(user: any) {
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
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const role = normalizedEmail === ADMIN_EMAIL ? "admin" : "user";

    const baseUsername =
      email?.split("@")[0]?.toLowerCase() ||
      fullName
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9]/g, "");

    const usernameCandidate = await generateUniqueUsername(baseUsername);

    const phoneValue = (countryCode || "") + (phone || "");

    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        fullName,
        email: normalizedEmail,
        username: usernameCandidate,
        role,
        countryCode: countryCode ?? null,
        phone: phoneValue ? phoneValue.replace(/\s+/g, "") : null,
        // Store hashed password in password columns
        password: hashed as any,
        passwordHash: hashed as any,
      },
    });

    const token = createToken(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
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

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          normalizedEmail ? { email: normalizedEmail } : undefined,
          { username: loginIdentifier.toLowerCase() },
          { phone: normalizedPhone },
        ].filter(Boolean) as any,
      },
    });

    if (!user || !user.password)
      return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password as any);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = createToken(user);

    console.log("LOGIN → token generated:", token.substring(0, 30) + "...");

    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ error: "Internal error" });
  }
});

/* ---------------------------------------------
   GET /api/auth/me  (protected)
---------------------------------------------- */
router.get("/me", authMiddleware, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    res.json({ user: user ? sanitizeUser(user) : null });
  } catch (error) {
    console.error("ME ERROR:", error);
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
