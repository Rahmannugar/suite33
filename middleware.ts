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
        getAll: async () => {
          const allCookies = req.cookies.getAll();
          return allCookies.map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll: async (cookies: { name: string; value: string }[]) => {
          cookies.forEach(({ name, value }) => {
            req.cookies.set(name, value);
          });
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

  // Protect dashboard and onboarding routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) {
    if (!user || !role) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
    // Role-based onboarding protection
    if (pathname.startsWith("/onboarding/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unathorized", req.url));
    }
    if (pathname.startsWith("/onboarding/staff") && role !== "STAFF") {
      return NextResponse.redirect(new URL("/unathorized", req.url));
    }
    // Role-based dashboard protection
    if (pathname.startsWith("/dashboard/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unathorized", req.url));
    }
    if (pathname.startsWith("/dashboard/staff") && role !== "STAFF") {
      return NextResponse.redirect(new URL("/unathorized", req.url));
    }
  }

  // Protect /dashboard root route
  if (pathname === "/dashboard") {
    if (!user || !role) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    }
    if (role === "STAFF") {
      return NextResponse.redirect(new URL("/dashboard/staff", req.url));
    }
    return NextResponse.redirect(new URL("/unathorized", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/auth/login",
    "/auth/signup",
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/api/:path*",
    "/",
    "/images/:path*",
    "/icons/:path*",
  ],
};
