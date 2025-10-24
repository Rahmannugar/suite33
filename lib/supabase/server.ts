import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const supabaseServer = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: async () => {
          const allCookies = cookieStore.getAll();
          return Array.from(allCookies.entries()).map(
            ([name, cookie]: [string, { value: string }]) => ({
              name,
              value: cookie.value,
            })
          );
        },
        setAll: async (cookies: { name: string; value: string }[]) => {
          cookies.forEach(({ name, value }) => {
            cookieStore.set({ name, value });
          });
        },
      },
    }
  );
};
