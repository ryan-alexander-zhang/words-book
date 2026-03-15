"use server";

import { auth } from "@/auth";
import {
  clearWordsForOwner,
  createWordsForOwner,
  deleteWordsForOwner,
  serializeWords
} from "@/lib/words";
import { type WordItem } from "@/lib/types";

type WordsMutationInput =
  | {
      type: "add";
      name: string;
    }
  | {
      type: "import";
      names: string[];
    }
  | {
      type: "delete";
      ids: number[];
    }
  | {
      type: "clear";
    };

export type WordsMutationResult = {
  words?: WordItem[];
  error?: string;
};

export async function mutateWordsAction(input: WordsMutationInput): Promise<WordsMutationResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: "Unauthorized"
    };
  }

  try {
    const words =
      input.type === "clear"
        ? await clearWordsForOwner(session.user.id)
        : input.type === "delete"
          ? await deleteWordsForOwner(session.user.id, input.ids)
          : await createWordsForOwner(
              session.user.id,
              input.type === "add" ? [input.name] : input.names
            ).then((result) => result.words);

    return {
      words: serializeWords(words)
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to update words."
    };
  }
}
