"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/hooks/useProfile";
import { useSettings } from "@/lib/hooks/useSettings";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const router = useRouter();
  const { profile, isLoading } = useProfile();
  const { updateSettings, deleteSettings } = useSettings();

  const [form, setForm] = useState({
    name: profile?.businessName || "",
    industry: profile?.industry || "",
    location: profile?.location || "",
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.businessId) return;

    setSaving(true);
    try {
      await updateSettings.mutateAsync({
        businessId: profile.businessId,
        ...form,
      });
      toast.success("Settings updated successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || !profile?.businessId) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="rounded-xl border border-[--border] bg-[--card] p-6">
        <h2 className="text-xl font-semibold mb-4">Settings</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Business Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Industry</label>
            <input
              type="text"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 text-white px-6 py-3 font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Delete Business Section */}
    </div>
  );
}