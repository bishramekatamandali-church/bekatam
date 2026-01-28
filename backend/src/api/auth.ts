import crypto from "crypto";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { authMiddleware } from "../middleware/auth";
import { handleDatabaseFallback } from "../utils/databaseFallback";
import { sendEmail } from "../services/emailService";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "bishramekatamandali@gmail.com").toLowerCase().trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "bishramekatamandali@15Done";
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || "Bishram Admin";

const router = express.Router();

const getFrontendUrl = () => process.env.FRONTEND_URL || "http://localhost:3000";
const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 10);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);

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

const generateOtpCode = () => `${Math.floor(100000 + Math.random() * 900000)}`;

const sendUserNotification = async (params: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) => {
  try {
    await sendEmail(params);
  } catch (error) {
    console.error("Failed to send user notification email:", error);
  }
};

const createEmailOtp = async (email: string, purpose: string) => {
  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.emailotp.create({
    data: {
      id: crypto.randomUUID(),
      email,
      codeHash,
      purpose,
      expiresAt,
    },
  });

  return { code, expiresAt };
};

const verifyEmailOtp = async (email: string, purpose: string, code: string) => {
  const otp = await prisma.emailotp.findFirst({
    where: {
      email,
      purpose,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return false;
  if (otp.attempts >= OTP_MAX_ATTEMPTS) return false;

  const matches = await bcrypt.compare(code, otp.codeHash);

  if (!matches) {
    await prisma.emailotp.update({
      where: { id: otp.id },
      data: { attempts: otp.attempts + 1 },
    });
    return false;
  }

  await prisma.emailotp.update({
    where: { id: otp.id },
    data: { usedAt: new Date() },
  });

  return true;
};

/* ---------------------------------------------
   POST /api/auth/register
---------------------------------------------- */
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, countryCode, phone, profileImageUrl } = req.body;

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

    const normalizedPhone = typeof phone === "string" ? phone.trim() : "";
    const normalizedCountryCode = typeof countryCode === "string" ? countryCode.trim() : "";
    const hasPhone = Boolean(normalizedPhone);
    const phoneValue = hasPhone ? `${normalizedCountryCode}${normalizedPhone}` : "";

    if (phoneValue) {
      const existingPhone = await prisma.user.findFirst({ where: { phone: phoneValue } });
      if (existingPhone) {
        return res.status(400).json({ error: "Phone already exists" });
      }
    }

    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        fullName,
        email: normalizedEmail,
        username: usernameCandidate,
        role,
        countryCode: hasPhone ? normalizedCountryCode || null : null,
        phone: phoneValue ? phoneValue.replace(/\s+/g, "") : null,
        profileImageUrl: typeof profileImageUrl === "string" ? profileImageUrl : null,
        // Store hashed password in password columns
        password: hashed as any,
        passwordHash: hashed as any,
      },
    });

    await sendUserNotification({
      to: normalizedEmail,
      subject: "Welcome to Bishram Ekata Mandali",
      text: `Hello ${fullName},\n\nWelcome to Bishram Ekata Mandali! Your account has been created successfully.\n\nIf you did not create this account, please contact us immediately.\n\n— Bishram Ekata Mandali`,
      html: `
        <p>Hello ${fullName},</p>
        <p>Welcome to Bishram Ekata Mandali! Your account has been created successfully.</p>
        <p>If you did not create this account, please contact us immediately.</p>
        <p>— Bishram Ekata Mandali</p>
      `,
    });

    const token = createToken(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const targets = Array.isArray(error.meta?.target)
        ? error.meta?.target
        : [error.meta?.target].filter(Boolean);
      if (targets.includes("email")) {
        return res.status(409).json({ error: "Email already exists" });
      }
      if (targets.includes("phone")) {
        return res.status(409).json({ error: "Phone already exists" });
      }
      if (targets.includes("username")) {
        return res.status(409).json({ error: "Username already exists" });
      }
      return res.status(409).json({ error: "Duplicate value" });
    }
    if (handleDatabaseFallback(req, res, error)) {
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

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          normalizedEmail ? { email: normalizedEmail } : undefined,
          { username: loginIdentifier.toLowerCase() },
          { phone: normalizedPhone },
        ].filter(Boolean) as any,
      },
    });

    const storedPassword = user?.password || user?.passwordHash;
    if (!user || !storedPassword)
      return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, storedPassword as any);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = createToken(user);

    await sendUserNotification({
      to: user.email,
      subject: "New login to your Bishram Ekata Mandali account",
      text: `Hello ${user.fullName},\n\nWe noticed a login to your account. If this was you, no action is needed.\nIf you did not log in, please reset your password or contact us.\n\n— Bishram Ekata Mandali`,
      html: `
        <p>Hello ${user.fullName},</p>
        <p>We noticed a login to your account. If this was you, no action is needed.</p>
        <p>If you did not log in, please reset your password or contact us.</p>
        <p>— Bishram Ekata Mandali</p>
      `,
    });

    console.log("LOGIN → token generated:", token.substring(0, 30) + "...");

    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    if (handleDatabaseFallback(req, res, error)) {
      return;
    }
    res.status(500).json({ error: "Internal error" });
  }
});

/* ---------------------------------------------
   POST /api/auth/request-otp
---------------------------------------------- */
router.post("/request-otp", async (req, res) => {
  try {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
      return res.status(400).json({ error: "Email and purpose are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const { code, expiresAt } = await createEmailOtp(normalizedEmail, purpose);

    await sendUserNotification({
      to: normalizedEmail,
      subject: "Your verification code",
      text: `Your verification code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`,
      html: `
        <p>Your verification code is <strong>${code}</strong>.</p>
        <p>This code expires in ${OTP_TTL_MINUTES} minutes.</p>
      `,
    });

    res.json({ success: true, message: "OTP sent.", expiresAt });
  } catch (error) {
    console.error("REQUEST OTP ERROR:", error);
    if (handleDatabaseFallback(req, res, error)) {
      return;
    }
    res.status(500).json({ error: "Internal error" });
  }
});

/* ---------------------------------------------
   POST /api/auth/verify-otp
---------------------------------------------- */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, purpose, code } = req.body;

    if (!email || !purpose || !code) {
      return res.status(400).json({ error: "Email, purpose, and code are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const isValid = await verifyEmailOtp(normalizedEmail, purpose, code);

    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    res.json({ success: true, message: "OTP verified." });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    if (handleDatabaseFallback(req, res, error)) {
      return;
    }
    res.status(500).json({ error: "Internal error" });
  }
});

/* ---------------------------------------------
   POST /api/auth/change-password
---------------------------------------------- */
router.post("/change-password", authMiddleware, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new passwords are required." });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const storedPassword = user.password || user.passwordHash;
    const match = await bcrypt.compare(currentPassword, storedPassword as any);
    if (!match) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed as any,
        passwordHash: hashed as any,
      },
    });

    await sendUserNotification({
      to: user.email,
      subject: "Your password has been changed",
      text: `Hello ${user.fullName},\n\nYour password was just changed. If this was not you, please reset your password immediately.\n\n— Bishram Ekata Mandali`,
      html: `
        <p>Hello ${user.fullName},</p>
        <p>Your password was just changed. If this was not you, please reset your password immediately.</p>
        <p>— Bishram Ekata Mandali</p>
      `,
    });

    res.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    if (handleDatabaseFallback(req, res, error)) {
      return;
    }
    res.status(500).json({ error: "Internal error" });
  }
});

/* ---------------------------------------------
   POST /api/auth/forgot-password
---------------------------------------------- */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
      const token = jwt.sign(
        { id: user.id, email: user.email, type: "password_reset" },
        process.env.JWT_SECRET as string,
        { expiresIn: "1h" }
      );

      const resetLink = `${getFrontendUrl()}/reset-password/${token}`;

      await sendUserNotification({
        to: user.email,
        subject: "Reset your Bishram Ekata Mandali password",
        text: `Hello ${user.fullName},\n\nWe received a request to reset your password. Use the link below to reset it:\n${resetLink}\n\nIf you did not request a reset, you can ignore this email.\n\n— Bishram Ekata Mandali`,
        html: `
          <p>Hello ${user.fullName},</p>
          <p>We received a request to reset your password. Use the link below to reset it:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>If you did not request a reset, you can ignore this email.</p>
          <p>— Bishram Ekata Mandali</p>
        `,
      });

      if (process.env.NODE_ENV !== "production") {
        return res.json({ success: true, message: "Password reset email sent.", token });
      }
    }

    res.json({ success: true, message: "If an account exists for that email, a reset link has been sent." });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    if (handleDatabaseFallback(req, res, error)) {
      return;
    }
    res.status(500).json({ error: "Internal error" });
  }
});

/* ---------------------------------------------
   POST /api/auth/reset-password
---------------------------------------------- */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required." });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch {
      return res.status(400).json({ error: "Invalid or expired reset token." });
    }

    if (!payload?.id || payload.type !== "password_reset") {
      return res.status(400).json({ error: "Invalid reset token." });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed as any,
        passwordHash: hashed as any,
      },
    });

    await sendUserNotification({
      to: user.email,
      subject: "Your password has been reset",
      text: `Hello ${user.fullName},\n\nYour password has been reset successfully. If you did not perform this action, please contact us immediately.\n\n— Bishram Ekata Mandali`,
      html: `
        <p>Hello ${user.fullName},</p>
        <p>Your password has been reset successfully. If you did not perform this action, please contact us immediately.</p>
        <p>— Bishram Ekata Mandali</p>
      `,
    });

    res.json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    if (handleDatabaseFallback(req, res, error)) {
      return;
    }
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
    if (handleDatabaseFallback(req, res, error)) {
      return;
    }
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
