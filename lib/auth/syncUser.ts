"use server";

import { prisma } from "../../prisma/config";

/**
 * Ensures every Supabase user has a matching Prisma User record.
 */
export async function syncUser(
  userId: string,
  email: string,
  role: "ADMIN" | "STAFF" | "SUB_ADMIN" = "ADMIN"
) {
  try {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (existing) return existing;

    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email,
        role,
      },
    });

    return newUser;
  } catch (error: unknown) {
    
    console.error("syncUser error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Failed to sync user to database: ${errorMessage}`);
  }
}
