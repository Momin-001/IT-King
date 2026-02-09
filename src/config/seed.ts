import bcrypt from "bcryptjs";
import { prisma } from "./prisma.js";

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "12341234";

  // Check if an admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { isAdmin: true },
  });

  if (existingAdmin) {
    console.log("Admin already exists. Skipping seed.");
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Create admin
  await prisma.user.create({
    data: {
      name: "Admin",
      email: adminEmail,
      password: hashedPassword,
      isAdmin: true,
    },
  });

  console.log("New Admin created");
}

export async function createAdminIfNotExists() {
  try {
    await seedAdmin();
  } catch (err: any) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}
