import { supabaseClient } from "@/lib/supabase/client";

export async function uploadAvatar(file: File, userId: string) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabaseClient.storage
    .from("avatars")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabaseClient.storage
    .from("avatars")
    .getPublicUrl(filePath);
  return data.publicUrl;
}
