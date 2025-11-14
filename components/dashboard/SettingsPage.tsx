"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/hooks/useProfile";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/authStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { profile, isLoading } = useProfile();
  const { updateName, updateIndustry, updateLocation, deleteBusiness } =
    useBusiness();
  const { signOut } = useAuth();

  const [openUpdateName, setOpenUpdateName] = useState(false);
  const [openUpdateIndustry, setOpenUpdateIndustry] = useState(false);
  const [openUpdateLocation, setOpenUpdateLocation] = useState(false);
  const [openDeleteBusiness, setOpenDeleteBusiness] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (user?.role !== "ADMIN") return null;

  function openNameDialog() {
    setBusinessName(profile?.businessName || "");
    setOpenUpdateName(true);
  }

  function openIndustryDialog() {
    setIndustry(profile?.industry || "");
    setOpenUpdateIndustry(true);
  }

  function openLocationDialog() {
    setLocation(profile?.location || "");
    setOpenUpdateLocation(true);
  }

  async function handleUpdateName(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = businessName.trim();
    if (!trimmedName) return;

    if (trimmedName === profile?.businessName) {
      setOpenUpdateName(false);
      setBusinessName("");
      return;
    }

    setSaving(true);
    try {
      await updateName.mutateAsync({ name: trimmedName });
      toast.success("Business name updated successfully!");
      setOpenUpdateName(false);
      setBusinessName("");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error || "Failed to update business name"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateIndustry(e: React.FormEvent) {
    e.preventDefault();
    const trimmedIndustry = industry.trim();
    if (!trimmedIndustry) return;

    if (trimmedIndustry === profile?.industry) {
      setOpenUpdateIndustry(false);
      setIndustry("");
      return;
    }

    setSaving(true);
    try {
      await updateIndustry.mutateAsync({ industry: trimmedIndustry });
      toast.success("Business industry updated successfully!");
      setOpenUpdateIndustry(false);
      setIndustry("");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error || "Failed to update business industry"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateLocation(e: React.FormEvent) {
    e.preventDefault();
    const trimmedLocation = location.trim();
    if (!trimmedLocation) return;

    if (trimmedLocation === profile?.location) {
      setOpenUpdateLocation(false);
      setLocation("");
      return;
    }

    setSaving(true);
    try {
      await updateLocation.mutateAsync({ location: trimmedLocation });
      toast.success("Business location updated successfully!");
      setOpenUpdateLocation(false);
      setLocation("");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error || "Failed to update business location"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBusiness(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.businessName) return;

    if (deleteConfirm !== profile.businessName) {
      toast.error("Business name does not match");
      return;
    }

    setDeleting(true);
    try {
      await deleteBusiness.mutateAsync();
      await signOut.mutateAsync();
      toast.success("Business deleted successfully");
      router.push("/");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to delete business");
    } finally {
      setDeleting(false);
    }
  }

  if (isLoading || !profile?.businessId) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="rounded-xl border border-[--border] bg-[--card] p-6">
        <h2 className="text-xl font-semibold mb-6">Business Settings</h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium mb-1">Business Name</h3>
              <p className="text-sm text-[--muted-foreground]">
                {profile.businessName}
              </p>
            </div>
            <button
              onClick={openNameDialog}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition"
            >
              Update Name
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium mb-1">Industry</h3>
              <p className="text-sm text-[--muted-foreground]">
                {profile.industry || "Not set"}
              </p>
            </div>
            <button
              onClick={openIndustryDialog}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition"
            >
              Update Industry
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium mb-1">Location</h3>
              <p className="text-sm text-[--muted-foreground]">
                {profile.location || "Not set"}
              </p>
            </div>
            <button
              onClick={openLocationDialog}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition"
            >
              Update Location
            </button>
          </div>

          <div className="border-t border-[--border] pt-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium mb-1 text-red-600">
                  Delete Business
                </h3>
                <p className="text-sm text-[--muted-foreground]">
                  Permanently delete your business and all associated data
                </p>
              </div>
              <button
                onClick={() => setOpenDeleteBusiness(true)}
                className="rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 transition"
              >
                Delete Business
              </button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={openUpdateName} onOpenChange={setOpenUpdateName}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Business Name</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateName} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Updating..." : "Update Name"}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openUpdateIndustry} onOpenChange={setOpenUpdateIndustry}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Industry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateIndustry} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Industry</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                required
                className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Updating..." : "Update Industry"}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openUpdateLocation} onOpenChange={setOpenUpdateLocation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Location</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateLocation} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Updating..." : "Update Location"}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openDeleteBusiness} onOpenChange={setOpenDeleteBusiness}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Business</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-[--muted-foreground]">
              Are you sure you want to delete your business? This action will
              soft delete all associated data.
            </p>
            <p className="text-sm font-medium">
              Enter business name:{" "}
              <span className="font-bold">{profile.businessName}</span>
            </p>
            <form onSubmit={handleDeleteBusiness} className="space-y-4">
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                required
                className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-red-500 outline-none transition"
                placeholder="Enter business name"
              />
              <button
                type="submit"
                disabled={deleting}
                className="w-full rounded-lg bg-red-600 text-white py-3 font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Delete Business"}
              </button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
