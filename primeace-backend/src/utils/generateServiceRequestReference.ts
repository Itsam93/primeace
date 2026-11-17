import { randomBytes } from "node:crypto";

export function generateServiceRequestReference(): string {
  const year = new Date().getFullYear();

  const reference = randomBytes(5)
    .toString("hex")
    .toUpperCase();

  return `PA-REQ-${year}-${reference}`;
}
