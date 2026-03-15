import { NextResponse } from "next/server";
import { authenticateBearerToken } from "@/lib/api-token-service";
import { createWordsForOwner, extractWordNames, listWordsForOwner, serializeWords } from "@/lib/words";

function unauthorized() {
  return NextResponse.json({ error: "Invalid API token" }, { status: 401 });
}

export async function GET(request: Request) {
  const authResult = await authenticateBearerToken(request);
  if (!authResult) {
    return unauthorized();
  }

  const words = await listWordsForOwner(authResult.userId);
  return NextResponse.json({ words: serializeWords(words) });
}

export async function POST(request: Request) {
  const authResult = await authenticateBearerToken(request);
  if (!authResult) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);

  try {
    const result = await createWordsForOwner(authResult.userId, extractWordNames(body));
    return NextResponse.json(
      {
        createdCount: result.createdCount,
        words: serializeWords(result.words)
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to add words" },
      { status: 400 }
    );
  }
}
