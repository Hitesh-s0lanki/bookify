import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/modules/user/model";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const existing = await UserModel.findOne({ clerkId: userId }).lean();
    if (existing) {
      return NextResponse.json({ alreadyExists: true });
    }

    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? "";
    const name = clerkUser?.fullName ?? clerkUser?.firstName ?? "";

    await UserModel.create({ clerkId: userId, email, name, plan: "free" });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST /api/users/onboard", e);
    return NextResponse.json({ error: "Failed to onboard user" }, { status: 500 });
  }
}
