// prisma/seed-admin.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  // ⚠️ CHANGE THESE or override via environment variables in production
  const ADMIN_EMAIL =
    process.env.INIT_ADMIN_EMAIL || "admin@bemchurch.dev";
  const ADMIN_PASSWORD =
    process.env.INIT_ADMIN_PASSWORD || "ChangeMe_Admin123!";
  const ADMIN_FULL_NAME =
    process.env.INIT_ADMIN_FULL_NAME || "Site Owner";
  const ADMIN_USERNAME =
    process.env.INIT_ADMIN_USERNAME || "siteowner";

  console.log("🔐 Admin seed starting...");

  // 1) If an owner already exists, don't create another
  const existingOwner = await prisma.user.findFirst({
    where: { role: "owner" as any },
  });

  if (existingOwner) {
    console.log("⚠️ An owner already exists:");
    console.log(`   Email: ${existingOwner.email}`);
    console.log("   No new owner created.");
    return;
  }

  // 2) If that email already exists, don't create another
  const existingByEmail = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existingByEmail) {
    console.log("⚠️ A user already exists with this email:");
    console.log(`   Email: ${existingByEmail.email}`);
    console.log("   Consider promoting that user manually instead.");
    return;
  }

  // 3) Hash password
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  // 4) Create the owner user
  const ownerUser = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      fullName: ADMIN_FULL_NAME,
      email: ADMIN_EMAIL,
      username: ADMIN_USERNAME,
      role: "owner",               // highest privilege
      password: hashedPassword as any,
      // ⬇️ If your User model has other NON-NULL fields with NO default,
      // add them here (e.g. createdAt, updatedAt) like:
      // createdAt: new Date(),
      // updatedAt: new Date(),
    },
  });

  console.log("✅ Owner admin created successfully:");
  console.log(`   Email:    ${ownerUser.email}`);
  console.log(`   Username: ${ownerUser.username}`);
  console.log("   Use the configured password to log in from the UI.");
}

main()
  .catch((e) => {
    console.error("❌ Admin seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
