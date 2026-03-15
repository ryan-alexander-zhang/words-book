import { type ApiToken } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { type ApiTokenStatus } from "@/lib/types";
import {
  generateApiTokenValue,
  parseApiTokenValue,
  shouldTouchLastUsed,
  verifyApiTokenSecret
} from "@/lib/api-token";

const apiTokenSelect = {
  createdAt: true,
  rotatedAt: true,
  lastUsedAt: true
} as const;

type ApiTokenSummary = Pick<ApiToken, "createdAt" | "rotatedAt" | "lastUsedAt"> | null;

function toIsoString(date: Date | null) {
  return date ? date.toISOString() : null;
}

export function serializeApiTokenStatus(token: ApiTokenSummary): ApiTokenStatus {
  return {
    hasToken: Boolean(token),
    createdAt: toIsoString(token?.createdAt ?? null),
    rotatedAt: toIsoString(token?.rotatedAt ?? null),
    lastUsedAt: toIsoString(token?.lastUsedAt ?? null)
  };
}

export async function getApiTokenStatus(userId: string) {
  const token = await prisma.apiToken.findUnique({
    where: { userId },
    select: apiTokenSelect
  });

  return serializeApiTokenStatus(token);
}

export async function createOrRotateApiToken(userId: string) {
  const { token, tokenHash, tokenId } = generateApiTokenValue();
  const now = new Date();

  await prisma.apiToken.upsert({
    where: { userId },
    create: {
      userId,
      tokenId,
      tokenHash,
      rotatedAt: now
    },
    update: {
      tokenId,
      tokenHash,
      rotatedAt: now,
      lastUsedAt: null
    }
  });

  return {
    value: token,
    status: await getApiTokenStatus(userId)
  };
}

export async function authenticateBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const parsed = parseApiTokenValue(authorization.slice("Bearer ".length).trim());
  if (!parsed) {
    return null;
  }

  const token = await prisma.apiToken.findUnique({
    where: { tokenId: parsed.tokenId },
    select: {
      tokenHash: true,
      userId: true,
      lastUsedAt: true
    }
  });

  if (!token || !verifyApiTokenSecret(parsed.tokenSecret, token.tokenHash)) {
    return null;
  }

  if (shouldTouchLastUsed(token.lastUsedAt)) {
    await prisma.apiToken.update({
      where: { tokenId: parsed.tokenId },
      data: { lastUsedAt: new Date() }
    });
  }

  return { userId: token.userId };
}
