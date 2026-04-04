import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { BookModel } from "@/modules/books/model";
import { UserModel } from "@/modules/user/model";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await UserModel.findOne({ clerkId: userId })
      .select("clerkId name plan")
      .lean();

    if (!user) {
      // User hasn't been onboarded yet — treat as free
      return NextResponse.json({ clerkId: userId, name: "", plan: "free", bookCount: 0 });
    }

    const bookCount = await BookModel.countDocuments({ userId });

    return NextResponse.json({
      clerkId: user.clerkId,
      name: user.name,
      plan: user.plan,
      bookCount,
    });
  } catch (e) {
    console.error("GET /api/users/me", e);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
