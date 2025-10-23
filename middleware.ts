import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if user is authenticated
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  const role = req.cookies.get("user_role")?.value;

  // Redirect authenticated users away from auth pages
  if (
    (pathname === "/auth/login" || pathname === "/auth/signup") &&
    user &&
    role
  ) {
    const dashboard =
      role === "ADMIN"
        ? "/dashboard/admin"
        : role === "STAFF"
        ? "/dashboard/staff"
        : "/dashboard";
    return NextResponse.redirect(new URL(dashboard, req.url));
  }

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

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const redirectUrl = new URL("/auth/login", req.url);
      redirectUrl.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Role-based dashboard access
    if (pathname.startsWith("/dashboard/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/unauthorized", req.url));
    }
    if (pathname.startsWith("/dashboard/staff") && role !== "STAFF") {
      return NextResponse.redirect(new URL("/dashboard/unauthorized", req.url));
    }

    // Set/update role cookie for session continuity
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
  matcher: [
    "/auth/login",
    "/auth/signup",
    "/dashboard/:path*",
    "/api/:path*",
    "/",
    "/images/:path*",
    "/icons/:path*",
  ],
};
