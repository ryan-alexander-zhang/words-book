"use server";

import { auth } from "@/auth";
import { createOrRotateApiToken } from "@/lib/api-token-service";

export async function rotateApiTokenAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: "Unauthorized"
    };
  }

  try {
    return await createOrRotateApiToken(session.user.id);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to update the access credential."
    };
  }
}
