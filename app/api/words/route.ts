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
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  await prisma.word.upsert({
    where: { name: name.toLowerCase() },
    update: {},
    create: {
      name: name.toLowerCase()
    }
  });

  const words = await prisma.word.findMany({
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ words });
}
