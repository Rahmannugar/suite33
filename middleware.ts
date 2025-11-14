import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname === "/" ||
    pathname === "/privacy-policy" ||
    pathname === "/terms-of-service" ||
    pathname === "/unathorized" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/icons")
  ) {
    return NextResponse.next();
  }

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

  if (!user || !role) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (pathname.startsWith("/onboarding/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unathorized", req.url));
  }
  if (
    pathname.startsWith("/onboarding/staff") &&
    role !== "STAFF" &&
    role !== "SUB_ADMIN"
  ) {
    return NextResponse.redirect(new URL("/unathorized", req.url));
  }

  if (pathname.startsWith("/dashboard/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unathorized", req.url));
  }
  if (
    pathname.startsWith("/dashboard/staff") &&
    role !== "STAFF" &&
    role !== "SUB_ADMIN"
  ) {
    return NextResponse.redirect(new URL("/unathorized", req.url));
  }

  if (pathname === "/dashboard") {
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    }
    if (role === "STAFF" || role === "SUB_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/staff", req.url));
    }
    return NextResponse.redirect(new URL("/unathorized", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/dashboard"],
};
