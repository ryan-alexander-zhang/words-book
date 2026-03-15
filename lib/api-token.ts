import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const API_TOKEN_PREFIX = "wb_";
const LAST_USED_TOUCH_WINDOW_MS = 15 * 60 * 1000;

export function generateApiTokenValue() {
  const tokenId = randomBytes(8).toString("hex");
  const tokenSecret = randomBytes(24).toString("base64url");

  return {
    token: `${API_TOKEN_PREFIX}${tokenId}.${tokenSecret}`,
    tokenId,
    tokenHash: hashApiTokenSecret(tokenSecret)
  };
}

export function parseApiTokenValue(token: string) {
  if (!token.startsWith(API_TOKEN_PREFIX)) {
    return null;
  }

  const [prefixedTokenId, tokenSecret, ...rest] = token.split(".");
  if (!prefixedTokenId || !tokenSecret || rest.length > 0) {
    return null;
  }

  const tokenId = prefixedTokenId.slice(API_TOKEN_PREFIX.length);
  if (!tokenId || !/^[a-f0-9]+$/i.test(tokenId)) {
    return null;
  }

  return { tokenId, tokenSecret };
}

export function hashApiTokenSecret(tokenSecret: string) {
  return createHash("sha256").update(tokenSecret).digest("hex");
}

export function verifyApiTokenSecret(tokenSecret: string, expectedHash: string) {
  const actual = createHash("sha256").update(tokenSecret).digest();
  const expected = Buffer.from(expectedHash, "hex");

  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}

export function shouldTouchLastUsed(lastUsedAt: Date | null) {
  if (!lastUsedAt) {
    return true;
  }

  return Date.now() - lastUsedAt.getTime() >= LAST_USED_TOUCH_WINDOW_MS;
}
