import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

/**
 * Deduplicated per-request user lookup.
 * Calling this multiple times in parallel actions (e.g. Promise.all)
 * executes the DB query only ONCE per render cycle.
 */
export const getAuthUser = cache(async () => {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    let user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      const clerkUser = await currentUser();
      if (!clerkUser) return null;

      const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User";
      user = await db.user.create({
        data: {
          clerkUserId: clerkUser.id,
          name,
          imageUrl: clerkUser.imageUrl,
          email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
        },
      });
    }

    return user;
  } catch (error) {
    console.error("getAuthUser error:", error);
    return null;
  }
});
