import {
  createCipheriv,
  createDecipheriv,
  randomBytes
} from "node:crypto";

import { env } from "../../config/env.js";
import { ApiError } from "../../shared/errors/ApiError.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

interface EncryptedToken {
  encryptedToken: string;
  iv: string;
  authTag: string;
}

function getEncryptionKey(): Buffer {
  const key = env.REVIEW_INVITATION_ENCRYPTION_KEY;

  if (!key) {
    throw new ApiError(
      503,
      "Review invitation encryption is not configured."
    );
  }

  return Buffer.from(key, "hex");
}

/**
 * Encrypts a review invitation token using AES-256-GCM.
 *
 * A unique initialization vector is generated for every encryption.
 */
export function encryptReviewInvitationToken(
  token: string
): EncryptedToken {
  if (!token || !/^[a-f\d]{64}$/i.test(token)) {
    throw new ApiError(
      400,
      "A valid review invitation token is required."
    );
  }

  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(
    ALGORITHM,
    getEncryptionKey(),
    iv,
    { authTagLength: AUTH_TAG_LENGTH }
  );

  const encryptedToken = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encryptedToken: encryptedToken.toString("hex"),
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex")
  };
}

/**
 * Decrypts a previously encrypted review invitation token.
 *
 * Authentication failure, corrupted ciphertext, or an incorrect key
 * causes decryption to fail.
 */
export function decryptReviewInvitationToken(
  input: EncryptedToken
): string {
  try {
    const iv = Buffer.from(input.iv, "hex");
    const authTag = Buffer.from(input.authTag, "hex");
    const encryptedToken = Buffer.from(
      input.encryptedToken,
      "hex"
    );

    if (
      iv.length !== IV_LENGTH ||
      authTag.length !== AUTH_TAG_LENGTH ||
      encryptedToken.length === 0
    ) {
      throw new Error("Invalid encrypted token data.");
    }

    const decipher = createDecipheriv(
      ALGORITHM,
      getEncryptionKey(),
      iv,
      { authTagLength: AUTH_TAG_LENGTH }
    );

    decipher.setAuthTag(authTag);

    const decryptedToken = Buffer.concat([
      decipher.update(encryptedToken),
      decipher.final()
    ]).toString("utf8");

    if (!/^[a-f\d]{64}$/i.test(decryptedToken)) {
      throw new Error("Invalid decrypted token.");
    }

    return decryptedToken;
  } catch {
    throw new ApiError(
      500,
      "The review invitation token could not be decrypted."
    );
  }
}
