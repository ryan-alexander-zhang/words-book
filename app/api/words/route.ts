import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  clearWordsForOwner,
  createWordsForOwner,
  deleteWordsForOwner,
  extractWordNames,
  listWordsForOwner,
  serializeWords
} from "@/lib/words";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  const words = await listWordsForOwner(session.user.id);
  return NextResponse.json({ words: serializeWords(words) });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);

  try {
    const { words } = await createWordsForOwner(session.user.id, extractWordNames(body));
    return NextResponse.json({ words: serializeWords(words) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to add words" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);

  try {
    const words = body?.all
      ? await clearWordsForOwner(session.user.id)
      : await deleteWordsForOwner(
          session.user.id,
          Array.isArray(body?.ids)
            ? body.ids.filter((id: unknown): id is number => typeof id === "number")
            : []
        );

    return NextResponse.json({ words: serializeWords(words) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete words" },
      { status: 400 }
    );
  }
}
