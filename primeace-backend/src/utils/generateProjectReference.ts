import { randomBytes } from "node:crypto";

export function generateProjectReference(): string {
  const year = new Date().getFullYear();
  const reference = randomBytes(5).toString("hex").toUpperCase();

  return `PA-PROJ-${year}-${reference}`;
}