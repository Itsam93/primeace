import { createHash, randomBytes } from "node:crypto";
import type { CookieOptions } from "express";

import { env } from "../config/env.js";

export const ADMIN_SESSION_COOKIE = "primeace_admin_session";
export const ADMIN_CSRF_COOKIE = "primeace_admin_csrf";

export const ADMIN_SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function generateCsrfToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function hashCsrfToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function getCookieSecurityOptions(): Pick<
  CookieOptions,
  "secure" | "sameSite" | "path"
> {
  const isProduction = env.NODE_ENV === "production";

  return {
    secure: isProduction,
    sameSite: "lax",
    path: "/"
  };
}

export function getAdminSessionCookieOptions(): CookieOptions {
  return {
    ...getCookieSecurityOptions(),
    httpOnly: true,
    maxAge: ADMIN_SESSION_DURATION_MS
  };
}

export function getAdminCsrfCookieOptions(): CookieOptions {
  return {
    ...getCookieSecurityOptions(),
    httpOnly: false,
    maxAge: ADMIN_SESSION_DURATION_MS
  };
}

export function getExpiredCookieOptions(): CookieOptions {
  return {
    ...getCookieSecurityOptions(),
    httpOnly: true
  };
}

export function getExpiredCsrfCookieOptions(): CookieOptions {
  return {
    ...getCookieSecurityOptions(),
    httpOnly: false
  };
}
