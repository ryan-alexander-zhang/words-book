import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const words = await prisma.word.findMany({
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json({ words });
}

export async function POST(request: Request) {
  const body = await request.json();
  const names: string[] = Array.isArray(body?.names)
    ? body.names
    : typeof body?.name === "string"
      ? [body.name]
      : [];
  const cleaned = Array.from(
    new Set(
      names
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    )
  );

  if (cleaned.length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  await prisma.word.createMany({
    data: cleaned.map((name) => ({ name })),
    skipDuplicates: true
  });

  const words = await prisma.word.findMany({
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ words });
}

export async function DELETE(request: Request) {
  const body = await request.json();

  if (body?.all) {
    await prisma.word.deleteMany({});
  } else if (Array.isArray(body?.ids) && body.ids.length > 0) {
    const ids = body.ids.filter((id: unknown) => typeof id === "number");
    if (ids.length === 0) {
      return NextResponse.json({ error: "No valid ids provided" }, { status: 400 });
    }
    await prisma.word.deleteMany({
      where: { id: { in: ids } }
    });
  } else {
    return NextResponse.json({ error: "Missing ids or all flag" }, { status: 400 });
  }

  const words = await prisma.word.findMany({
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ words });
}
