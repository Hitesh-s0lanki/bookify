import type { currentUser } from "@clerk/nextjs/server";

import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/modules/user/model";

type ClerkLikeUser = Awaited<ReturnType<typeof currentUser>>;

function getPrimaryEmail(user?: ClerkLikeUser | null) {
  return user?.emailAddresses?.[0]?.emailAddress?.trim() ?? "";
}

function getDisplayName(user?: ClerkLikeUser | null) {
  return (
    user?.fullName?.trim() ??
    user?.firstName?.trim() ??
    user?.username?.trim() ??
    ""
  );
}

export async function ensureUserRecord(params: {
  clerkId: string;
  clerkUser?: ClerkLikeUser | null;
}) {
  await connectToDatabase();

  const { clerkId, clerkUser } = params;
  const email = getPrimaryEmail(clerkUser);
  const name = getDisplayName(clerkUser);

  const existing = await UserModel.findOne({ clerkId });
  if (existing) {
    let shouldSave = false;

    if (email && existing.email !== email) {
      existing.email = email;
      shouldSave = true;
    }

    if (name && existing.name !== name) {
      existing.name = name;
      shouldSave = true;
    }

    if (shouldSave) {
      await existing.save();
    }

    return { user: existing, created: false };
  }

  const createdUser = await UserModel.create({
    clerkId,
    email,
    name,
    plan: "free",
  });

  return { user: createdUser, created: true };
}
