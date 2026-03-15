import { type Word } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { type WordItem } from "@/lib/types";
import { normalizeValidatedWordNames } from "@/lib/word-validation";

export type CreateWordsResult = {
  createdCount: number;
  words: Word[];
};

export function extractWordNames(body: unknown) {
  if (body && typeof body === "object" && "names" in body && Array.isArray(body.names)) {
    return body.names.filter((value): value is string => typeof value === "string");
  }

  if (body && typeof body === "object" && "name" in body && typeof body.name === "string") {
    return [body.name];
  }

  return [];
}

export async function listWordsForOwner(ownerId: string) {
  return prisma.word.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" }
  });
}

export async function createWordsForOwner(ownerId: string, names: string[]): Promise<CreateWordsResult> {
  const cleaned = normalizeValidatedWordNames(names);

  const result = await prisma.word.createMany({
    data: cleaned.map((name) => ({ name, ownerId })),
    skipDuplicates: true
  });

  return {
    createdCount: result.count,
    words: await listWordsForOwner(ownerId)
  };
}

export async function deleteWordsForOwner(ownerId: string, ids: number[]) {
  if (ids.length === 0) {
    throw new Error("No valid ids provided");
  }

  await prisma.word.deleteMany({
    where: {
      ownerId,
      id: { in: ids }
    }
  });

  return listWordsForOwner(ownerId);
}

export async function clearWordsForOwner(ownerId: string) {
  await prisma.word.deleteMany({
    where: { ownerId }
  });

  return listWordsForOwner(ownerId);
}

export function serializeWords(words: Word[]): WordItem[] {
  return words.map((word) => ({
    id: word.id,
    name: word.name,
    createdAt: word.createdAt.toISOString()
  }));
}
