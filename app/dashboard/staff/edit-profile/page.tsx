"use client";

import { useAuthStore } from "@/lib/stores/authStore";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/Toggler";
import { uploadAvatar } from "@/lib/utils/uploadImage";
import axios from "axios";
import { toast } from "sonner";
import Image from "next/image";

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function EditProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    user?.avatarUrl ?? null
  );
  const [saving, setSaving] = useState(false);

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
      await axios.post("/api/onboarding/staff", {
        userId: user.id,
        fullName,
        avatarUrl,
      });
      setUser({ ...user, fullName, avatarUrl });
      toast.success("Profile updated!");
      router.push("/dashboard/staff");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-background">
      <div className="w-full max-w-md rounded-2xl border border-[--border] bg-[--card] text-[--card-foreground] shadow-sm p-8">
        <ThemeToggle />
        <div className="flex justify-center mb-6">
          {preview ? (
            <Image
              src={preview}
              alt="Profile Picture"
              width={64}
              height={64}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="rounded-full w-16 h-16 bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
              {getInitials(user?.fullName ?? user?.email)}
            </div>
          )}
        </div>
        <h1 className="text-2xl font-semibold text-center mb-1">
          Edit Profile
        </h1>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[--muted-foreground]">
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
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[--muted-foreground]">
              Profile Picture
            </label>
            <div className="flex items-center gap-3">
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer px-4 py-2 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-100 border border-[--input]"
              >
                {file ? "Change" : "Upload"}
              </label>
            </div>
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
