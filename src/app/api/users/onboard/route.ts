import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { ensureUserRecord } from "@/modules/user/service";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    const { created } = await ensureUserRecord({ clerkId: userId, clerkUser });

    if (!created) {
      return NextResponse.json({ alreadyExists: true });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST /api/users/onboard", e);
    return NextResponse.json({ error: "Failed to onboard user" }, { status: 500 });
  }
}
