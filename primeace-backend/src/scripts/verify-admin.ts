import "dotenv/config";

import argon2 from "argon2";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { Admin } from "../modules/auth/Admin.js";

async function verifyAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required.");
  }

  try {
    await connectDatabase();

    const admin = await Admin.findOne({ email })
      .select("+passwordHash");

    if (!admin) {
      console.log("RESULT: Administrator record not found.");
      return;
    }

    console.log("Administrator found:", true);
    console.log("Account active:", admin.isActive);
    console.log("Account deleted:", admin.isDeleted);

    const passwordMatches = await argon2.verify(
      admin.passwordHash,
      password
    );

    console.log("Password matches stored hash:", passwordMatches);
  } finally {
    await disconnectDatabase();
  }
}

verifyAdmin().catch((error: unknown) => {
  console.error(
    "Verification failed:",
    error instanceof Error ? error.message : error
  );

  process.exitCode = 1;
});
