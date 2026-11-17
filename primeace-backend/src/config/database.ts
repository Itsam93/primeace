import mongoose from "mongoose";

import { env } from "./env.js";

const DATABASE_OPTIONS = {
  serverSelectionTimeoutMS: 10_000,
  autoIndex: env.NODE_ENV !== "production"
};

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (connectionPromise) {
    await connectionPromise;
    return;
  }

  connectionPromise = mongoose.connect(
    env.MONGODB_URI,
    DATABASE_OPTIONS
  );

  try {
    await connectionPromise;

    console.log("MongoDB connected successfully.");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  } finally {
    connectionPromise = null;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();

  console.log("MongoDB disconnected successfully.");
}

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB connection lost.");
});

mongoose.connection.on("error", (error: Error) => {
  console.error("MongoDB connection error:", error);
});
