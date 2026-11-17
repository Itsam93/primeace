import "dotenv/config";

import argon2 from "argon2";

import {
  connectDatabase,
  disconnectDatabase
} from "../config/database.js";

import {Admin} from "../modules/auth/Admin.js";

async function changeAdminPassword() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const newPassword = process.env.NEW_ADMIN_PASSWORD;

  if (!email || !newPassword) {
    throw new Error(
      "ADMIN_EMAIL and NEW_ADMIN_PASSWORD environment variables are required."
    );
  }

  if (newPassword.length < 12) {
    throw new Error(
      "Password must contain at least 12 characters."
    );
  }

  try {
    await connectDatabase();

    const admin = await Admin.findOne({
      email,
      isActive: true,
      isDeleted: false
    });

    if (!admin) {
      throw new Error(
        `No active administrator found for ${email}.`
      );
    }

    admin.passwordHash = await argon2.hash(newPassword);

    await admin.save();

    console.log("Administrator password updated successfully.");
    console.log(`Administrator: ${email}`);
  } finally {
    await disconnectDatabase();
  }
}

changeAdminPassword().catch((error: unknown) => {
  console.error(
    "Password update failed:",
    error instanceof Error ? error.message : error
  );

  process.exitCode = 1;
});
