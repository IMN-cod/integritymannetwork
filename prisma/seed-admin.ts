import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@imn.com";
  const password = process.env.ADMIN_PASSWORD || "REDACTED_SEE_ENV";
  const firstName = process.env.ADMIN_FIRST_NAME || "Admin";
  const lastName = process.env.ADMIN_LAST_NAME || "TIMN";

  console.log("───────────────────────────────────────");
  console.log("  TIMN Admin Seeder");
  console.log("───────────────────────────────────────");

  // Check if admin already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // Update role to SUPER_ADMIN if not already
    if (existingUser.role !== "SUPER_ADMIN") {
      await prisma.user.update({
        where: { email },
        data: { role: "SUPER_ADMIN" },
      });
      console.log(`✓ Upgraded ${email} to SUPER_ADMIN`);
    } else {
      console.log(`✓ Admin already exists: ${email} (SUPER_ADMIN)`);
    }
  } else {
    // Create new admin user
    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: "SUPER_ADMIN",
        isActive: true,
      },
    });

    console.log(`✓ Created SUPER_ADMIN:`);
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    console.log("");
    console.log("  ⚠ Change this password after first login!");
  }

  console.log("───────────────────────────────────────");
}

seedAdmin()
  .catch((error) => {
    console.error("✗ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
