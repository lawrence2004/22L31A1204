const SHORT_RE = /^[A-Za-z0-9_-]{4,20}$/;

export function isValidUrl(value) {
  try {
    const u = new URL(value);
    return ["http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
}

export function normalizeMinutes(min) {
  if (min === undefined || min === null) return 30;
  const n = Number(min);
  if (!Number.isInteger(n) || n <= 0) return null;
  return Math.min(n, 60 * 24 * 30);
}

export function validateShortcode(sc) {
  return SHORT_RE.test(sc);
}
