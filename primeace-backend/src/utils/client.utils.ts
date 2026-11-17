export function normalizeEmail(
  email?: string | null
): string | null {
  const normalized = email?.trim().toLowerCase();

  return normalized || null;
}

export function normalizePhone(
  phone: string
): string {
  return phone.replace(/[^\d+]/g, "");
}
