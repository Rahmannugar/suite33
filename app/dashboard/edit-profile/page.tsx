"use client";

import { useSidebarStore } from "@/lib/stores/sidebarStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { useProfile } from "@/lib/hooks/useProfile";
import { uploadAvatar } from "@/lib/utils/uploadImage";
import axios from "axios";
import { toast } from "sonner";
import Image from "next/image";
import { ArrowLeft, Upload, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const setUser = useAuthStore((state) => state.setUser);
  const router = useRouter();
  const { profile, refetch } = useProfile();
  const collapsed = useSidebarStore((state) => state.collapsed);

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    user?.avatarUrl ?? null
  );
  const [saving, setSaving] = useState(false);

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
      if (user.role === "ADMIN") {
        await axios.put("/api/profile/admin", {
          userId: user.id,
          fullName,
          logoUrl: avatarUrl,
        });
        setUser({ ...user, fullName });
        await refetch();
      } else {
        await axios.put("/api/profile/staff", {
          userId: user.id,
          fullName,
          avatarUrl,
        });
        setUser({ ...user, fullName, avatarUrl });
      }
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
            <div className="rounded-full w-16 h-16 bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600 border border-[--border]">
              {getInitials(
                user?.role === "ADMIN"
                  ? profile?.businessName
                  : user?.fullName ?? user?.email
              )}
            </div>
          )}
        </div>

        <h1 className="text-2xl font-semibold text-center mb-1">
          Edit Profile
        </h1>

        <form onSubmit={handleSave} className="space-y-5 mt-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[--muted-foreground]">
              {user?.role === "ADMIN" ? "Your Full Name" : "Full Name"}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          {/* Upload Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[--muted-foreground]">
              {user?.role === "ADMIN" ? "Business Logo" : "Profile Picture"}
            </label>
            <div className="flex items-center gap-3">
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() =>
                  document.getElementById("avatar-upload")?.click()
                }
                className="p-2 rounded-full border cursor-pointer border-[--input] bg-[--card] hover:bg-[--muted] transition active:scale-95"
                aria-label={file ? "Change image" : "Upload image"}
              >
                {file ? <RefreshCw size={20} /> : <Upload size={20} />}
              </button>

              {preview && (
                <Image
                  src={preview}
                  alt="Preview"
                  width={48}
                  height={48}
                  className="rounded-full object-cover border border-[--border]"
                  style={{ width: "48px", height: "48px" }}
                  unoptimized
                  priority
                />
              )}
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
