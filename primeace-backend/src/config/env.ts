import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const currentDirectory = dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: resolve(currentDirectory, "../../../.env")
});

const optionalEnvString = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === ""
      ? undefined
      : value,
  z.string().trim().min(1).optional()
);

const frontendUrlSchema = z.url().refine(
  (value) => {
    const url = new URL(value);

    return ["http:", "https:"].includes(url.protocol);
  },
  "FRONTEND_URL must use HTTP or HTTPS."
);

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

    PORT: z.coerce
      .number()
      .int()
      .min(1)
      .max(65535)
      .default(5000),

    MONGODB_URI: z
      .string()
      .trim()
      .min(1, "MONGODB_URI is required.")
      .regex(
        /^mongodb(?:\+srv)?:\/\//,
        "MONGODB_URI must be a valid MongoDB connection string."
      ),

    FRONTEND_URL: frontendUrlSchema,

    CLOUDINARY_CLOUD_NAME: optionalEnvString,
    CLOUDINARY_API_KEY: optionalEnvString,
    CLOUDINARY_API_SECRET: optionalEnvString,

    RESEND_API_KEY: optionalEnvString,
    EMAIL_FROM: optionalEnvString,

    REVIEW_INVITATION_ENCRYPTION_KEY: optionalEnvString
  })
  .strict()
  .superRefine((values, context) => {
    const cloudinaryValues = [
      values.CLOUDINARY_CLOUD_NAME,
      values.CLOUDINARY_API_KEY,
      values.CLOUDINARY_API_SECRET
    ];

    const cloudinaryConfigured = cloudinaryValues.some(Boolean);

    if (
      cloudinaryConfigured &&
      cloudinaryValues.some((value) => !value)
    ) {
      context.addIssue({
        code: "custom",
        message:
          "All three Cloudinary environment variables must be provided together.",
        path: ["CLOUDINARY_CLOUD_NAME"]
      });
    }

    if (
      Boolean(values.RESEND_API_KEY) !==
      Boolean(values.EMAIL_FROM)
    ) {
      context.addIssue({
        code: "custom",
        message:
          "RESEND_API_KEY and EMAIL_FROM must be provided together.",
        path: ["RESEND_API_KEY"]
      });
    }

    if (
      values.RESEND_API_KEY &&
      !values.REVIEW_INVITATION_ENCRYPTION_KEY
    ) {
      context.addIssue({
        code: "custom",
        message:
          "REVIEW_INVITATION_ENCRYPTION_KEY is required when email delivery is configured.",
        path: ["REVIEW_INVITATION_ENCRYPTION_KEY"]
      });
    }

    if (
      values.REVIEW_INVITATION_ENCRYPTION_KEY &&
      !/^[a-f\d]{64}$/i.test(
        values.REVIEW_INVITATION_ENCRYPTION_KEY
      )
    ) {
      context.addIssue({
        code: "custom",
        message:
          "REVIEW_INVITATION_ENCRYPTION_KEY must be exactly 64 hexadecimal characters (32 bytes).",
        path: ["REVIEW_INVITATION_ENCRYPTION_KEY"]
      });
    }
  });

// Validate only variables belonging to the application.
const applicationEnv = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  MONGODB_URI: process.env.MONGODB_URI,
  FRONTEND_URL: process.env.FRONTEND_URL,

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,

  REVIEW_INVITATION_ENCRYPTION_KEY:
    process.env.REVIEW_INVITATION_ENCRYPTION_KEY
};

const parsedEnv = envSchema.safeParse(applicationEnv);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => {
      const field = issue.path.join(".");

      return `${field}: ${issue.message}`;
    })
    .join("\n");

  console.error(`Invalid environment configuration:\n${issues}`);

  process.exit(1);
}

export const env = parsedEnv.data;

export type Environment = typeof env;
