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
    process.env.INIT_ADMIN_FULL_NAME || "Site Administrator";
  const ADMIN_USERNAME =
    process.env.INIT_ADMIN_USERNAME || "siteadmin";

  console.log("🔐 Admin seed starting...");

  // 1) If that email already exists, don't create another
  const existingByEmail = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existingByEmail) {
    console.log("⚠️ A user already exists with this email:");
    console.log(`   Email: ${existingByEmail.email}`);
    console.log("   Consider promoting that user manually instead.");
    return;
  }

  // 2) Hash password
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  // 3) Create the admin user
  const adminUser = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      fullName: ADMIN_FULL_NAME,
      email: ADMIN_EMAIL,
      username: ADMIN_USERNAME,
      role: "admin",               // highest privilege
      password: hashedPassword as any,
      // ⬇️ If your User model has other NON-NULL fields with NO default,
      // add them here (e.g. createdAt, updatedAt) like:
      // createdAt: new Date(),
      // updatedAt: new Date(),
    },
  });

  console.log("✅ Admin user created successfully:");
  console.log(`   Email:    ${adminUser.email}`);
  console.log(`   Username: ${adminUser.username}`);
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
