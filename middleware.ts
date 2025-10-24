import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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
  if (pathname === "/dashboard") {
    if (!user || !role) {
      // Redirect to login if cookie/session missing
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    }
    if (role === "STAFF") {
      return NextResponse.redirect(new URL("/dashboard/staff", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard/unathorized", req.url));
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
