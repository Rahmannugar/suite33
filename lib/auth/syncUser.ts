"use server";

import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

/**
 * Ensures every Supabase user has a matching Prisma User record.
 */
export async function syncUser(userId: string, email: string) {
  try {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (existing) return existing;

    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email,
        role: "ADMIN",
      },
    });

    return newUser;
  } catch (error) {
    console.error("syncUser error:", error);
    throw new Error("Failed to sync user to database");
  }
}
