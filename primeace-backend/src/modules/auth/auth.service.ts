import argon2 from "argon2";

import { Admin } from "./Admin.js";
import { AdminSession } from "./adminSession.js";

import {
  ADMIN_SESSION_DURATION_MS,
  generateCsrfToken,
  generateSessionToken,
  hashCsrfToken,
  hashSessionToken
} from "../../utils/session.utils.js";

import { ApiError } from "../../shared/errors/ApiError.js";

interface LoginCredentials {
  email: string;
  password: string;
}

interface CreateSessionMetadata {
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuthenticatedAdmin {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface LoginResult {
  token: string;
  csrfToken: string;
  expiresAt: Date;
  admin: AuthenticatedAdmin;
}

function toAuthenticatedAdmin(admin: {
  _id: unknown;
  fullName: string;
  email: string;
  role: string;
}): AuthenticatedAdmin {
  return {
    id: String(admin._id),
    fullName: admin.fullName,
    email: admin.email,
    role: admin.role
  };
}

export async function loginAdmin(
  credentials: LoginCredentials,
  metadata: CreateSessionMetadata
): Promise<LoginResult> {
  const admin = await Admin.findOne({
    email: credentials.email,
    isActive: true,
    isDeleted: false
  }).select("+passwordHash");

  if (!admin) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const passwordIsValid = await argon2.verify(
    admin.passwordHash,
    credentials.password
  );

  if (!passwordIsValid) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const token = generateSessionToken();
  const csrfToken = generateCsrfToken();
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_DURATION_MS);

  await AdminSession.create({
    adminId: admin._id,
    tokenHash: hashSessionToken(token),
    csrfTokenHash: hashCsrfToken(csrfToken),
    expiresAt,
    lastUsedAt: new Date(),
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent
  });

  return {
    token,
    csrfToken,
    expiresAt,
    admin: toAuthenticatedAdmin(admin)
  };
}

export async function logoutAdmin(token: string): Promise<void> {
  await AdminSession.updateOne(
    {
      tokenHash: hashSessionToken(token),
      revokedAt: null
    },
    {
      $set: {
        revokedAt: new Date()
      }
    }
  );
}

export function getAuthenticatedAdmin(admin: {
  _id: unknown;
  fullName: string;
  email: string;
  role: string;
}): AuthenticatedAdmin {
  return toAuthenticatedAdmin(admin);
}
