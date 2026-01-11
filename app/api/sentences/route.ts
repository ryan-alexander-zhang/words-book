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
  const incomingItems: { content: string; annotation: string }[] = Array.isArray(body?.items)
    ? body.items
        .filter((item: unknown) => item && typeof item === "object")
        .map((item: { content?: string; annotation?: string }) => ({
          content: item.content ?? "",
          annotation: item.annotation ?? ""
        }))
    : Array.isArray(body?.contents)
      ? body.contents.map((content: string) => ({ content, annotation: "" }))
      : typeof body?.content === "string"
        ? [
            {
              content: body.content,
              annotation: typeof body?.annotation === "string" ? body.annotation : ""
            }
          ]
        : [];
  const cleaned = incomingItems
    .map((item) => ({
      content: item.content.trim(),
      annotation: item.annotation.trim()
    }))
    .filter((item) => item.content);
  const unique = Array.from(
    new Map(cleaned.map((item) => [item.content, item])).values()
  );

  if (unique.length === 0) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  await prisma.sentence.createMany({
    data: unique.map((item) => ({
      content: item.content,
      annotation: item.annotation
    })),
    skipDuplicates: true
  });

  const refreshedItems = await prisma.sentence.findMany({
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ items: refreshedItems });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const id = typeof body?.id === "number" ? body.id : null;
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const annotation = typeof body?.annotation === "string" ? body.annotation.trim() : "";

  if (!id || !content) {
    return NextResponse.json({ error: "Id and content are required" }, { status: 400 });
  }

  await prisma.sentence.update({
    where: { id },
    data: { content, annotation }
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
