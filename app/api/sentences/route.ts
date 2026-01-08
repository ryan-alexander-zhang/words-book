import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.sentence.findMany({
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const body = await request.json();
  const contents: string[] = Array.isArray(body?.contents)
    ? body.contents
    : typeof body?.content === "string"
      ? [body.content]
      : [];
  const cleaned = Array.from(
    new Set(
      contents
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );

  if (cleaned.length === 0) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  await prisma.sentence.createMany({
    data: cleaned.map((content) => ({ content })),
    skipDuplicates: true
  });

  const items = await prisma.sentence.findMany({
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ items });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const id = typeof body?.id === "number" ? body.id : null;
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  if (!id || !content) {
    return NextResponse.json({ error: "Id and content are required" }, { status: 400 });
  }

  await prisma.sentence.update({
    where: { id },
    data: { content }
  });

  const items = await prisma.sentence.findMany({
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ items });
}

export async function DELETE(request: Request) {
  const body = await request.json();

  if (body?.all) {
    await prisma.sentence.deleteMany({});
  } else if (Array.isArray(body?.ids) && body.ids.length > 0) {
    const ids = body.ids.filter((id: unknown) => typeof id === "number");
    if (ids.length === 0) {
      return NextResponse.json({ error: "No valid ids provided" }, { status: 400 });
    }
    await prisma.sentence.deleteMany({
      where: { id: { in: ids } }
    });
  } else {
    return NextResponse.json({ error: "Missing ids or all flag" }, { status: 400 });
  }

  const items = await prisma.sentence.findMany({
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ items });
}
