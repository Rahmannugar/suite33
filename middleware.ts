import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    pathname === "/" ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/icons")
  ) {
    return NextResponse.next();
  }

  // Protect all dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
        },
      }
    );

    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) {
      const redirectUrl = new URL("/auth/login", req.url);
      redirectUrl.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Read cached role from cookie
    const cookieRole = req.cookies.get("user_role")?.value;

    let role = cookieRole;

    // Fallback: If cookie missing, fetch from Prisma
    if (!role) {
      const record = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });
      role = record?.role || "STAFF";
    }

    // Role-based routing logic
    const isAdminRoute = pathname.startsWith("/dashboard/admin");
    const isStaffRoute = pathname.startsWith("/dashboard/staff");

    if (isAdminRoute && role !== "ADMIN") {
      const unauthorizedUrl = new URL("/dashboard/unauthorized", req.url);
      return NextResponse.redirect(unauthorizedUrl);
    }

    if (isStaffRoute && role !== "STAFF") {
      const unauthorizedUrl = new URL("/dashboard/unauthorized", req.url);
      return NextResponse.redirect(unauthorizedUrl);
    }

    // If authenticated and authorized, allow access
    const res = NextResponse.next();
    res.cookies.set("user_role", role, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
