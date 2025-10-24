import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { role } = await req.json();
  if (!role)
    return NextResponse.json({ error: "Missing role" }, { status: 400 });

  // cookies to expire in 6 hours
  const expires = new Date(Date.now() + 6 * 60 * 60 * 1000);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("user_role", role, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("user_role");
  return res;
}
