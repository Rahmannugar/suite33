"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { useSidebarStore } from "@/lib/stores/sidebarStore";
import { useProfile } from "@/lib/hooks/useProfile";
import { useEditProfile } from "@/lib/hooks/useEditProfile";
import { uploadAvatar } from "@/lib/utils/uploadImage";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

function getInitials(name?: string | null) {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function EditProfilePage() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const { profile } = useProfile();
  const collapsed = useSidebarStore((state) => state.collapsed);

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    user?.avatarUrl ?? null
  );
  const [saving, setSaving] = useState(false);

  const updateProfile = useEditProfile();

  const navigateFn = () => {
    router.push(
      user?.role === "ADMIN" ? "/dashboard/admin" : "/dashboard/staff"
    );
  };

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    try {
      let avatarUrl = user.avatarUrl;
      if (file) {
        avatarUrl = await uploadAvatar(file, user.id);
      }
      await updateProfile.mutateAsync({
        user,
        fullName,
        file,
      });
      toast.success("Profile updated!");
      navigateFn();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  const leftClass = collapsed ? "md:left-24" : "md:left-[272px]";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-background relative">
      <button
        type="button"
        onClick={navigateFn}
        className={`fixed top-24 left-7 ${leftClass} p-2 rounded-full border border-[--border] hover:bg-[--muted] transition-all hover:scale-95 cursor-pointer z-30`}
        aria-label="Go back"
      >
        <ArrowLeft size={20} />
      </button>

      <div className="w-full max-w-md rounded-2xl border border-[--border] bg-[--card] text-[--card-foreground] shadow-sm p-8">
        <div className="flex justify-center mb-6">
          {preview ? (
            <Image
              src={preview}
              alt={user?.role === "ADMIN" ? "Business Logo" : "Profile Picture"}
              width={64}
              height={64}
              className="rounded-full object-cover w-16 h-16 border border-[--border]"
              unoptimized
            />
          ) : (
            <span className="inline-flex items-center justify-center rounded-full w-16 h-16 font-bold text-white bg-blue-600 text-2xl">
              {getInitials(fullName)}
            </span>
          )}
        </div>

        <h1 className="text-2xl font-semibold text-center mb-1">
          Edit Profile
        </h1>

        <form onSubmit={handleSave} className="space-y-5 mt-5">
          <div>
            <label className="block text-sm font-medium text-[--muted-foreground] mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[--muted-foreground] mb-1">
              {user?.role === "ADMIN" ? "Business Logo" : "Profile Picture"}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <button
            type="submit"
            className={`w-full rounded-lg bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 transition ${
              saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
