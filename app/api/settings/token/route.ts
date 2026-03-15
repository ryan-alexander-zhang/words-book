import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createOrRotateApiToken, getApiTokenStatus } from "@/lib/api-token-service";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  return NextResponse.json({
    token: await getApiTokenStatus(session.user.id)
  });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  const token = await createOrRotateApiToken(session.user.id);
  return NextResponse.json(token);
}
