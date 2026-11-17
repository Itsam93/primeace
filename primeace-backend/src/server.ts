import { createServer } from "node:http";

import app from "./app.js";
import { env } from "./config/env.js";
import {
  connectDatabase,
  disconnectDatabase
} from "./config/database.js";

const server = createServer(app);

const SHUTDOWN_TIMEOUT_MS = 10_000;

let isShuttingDown = false;
let isListening = false;

async function startServer(): Promise<void> {
  await connectDatabase();

  if (isShuttingDown) {
    await disconnectDatabase();
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const handleError = (error: Error): void => {
      server.off("listening", handleListening);
      reject(error);
    };

    const handleListening = (): void => {
      server.off("error", handleError);
      isListening = true;
      resolve();
    };

    server.once("error", handleError);
    server.once("listening", handleListening);

    server.listen(env.PORT);
  });

  if (isShuttingDown) {
    await shutdown("STARTUP");
    return;
  }

  console.log(`PrimeAce API listening on port ${env.PORT}.`);
  console.log(`Environment: ${env.NODE_ENV}`);
}

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(`\n${signal} received. Shutting down gracefully...`);

  const forceCloseTimer = setTimeout(() => {
    console.error("Graceful shutdown timed out. Closing connections.");

    server.closeAllConnections();
  }, SHUTDOWN_TIMEOUT_MS);

  forceCloseTimer.unref();

  try {
    if (isListening) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }

    await disconnectDatabase();

    console.log("PrimeAce API shut down successfully.");
    process.exitCode = 0;
  } catch (error) {
    console.error("Error during server shutdown:", error);
    process.exitCode = 1;
  } finally {
    clearTimeout(forceCloseTimer);
  }
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

startServer().catch(async (error: unknown) => {
  console.error("Failed to start PrimeAce API:", error);

  try {
    await disconnectDatabase();
  } catch (disconnectError) {
    console.error("Database cleanup failed:", disconnectError);
  }

  process.exitCode = 1;
});
