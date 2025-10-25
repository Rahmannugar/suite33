import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const user = data.users.find((u) => u.email === email);
  if (!user) {
    return NextResponse.json({ exists: false });
  }

  return NextResponse.json({
    exists: true,
    provider: user.app_metadata?.provider ?? "email",
  });
}
