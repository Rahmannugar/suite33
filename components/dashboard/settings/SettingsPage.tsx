"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/hooks/profile/useProfile";
import { useBusiness } from "@/lib/hooks/business/useBusiness";
import { useAuth } from "@/lib/hooks/auth/useAuth";
import { useAuthStore } from "@/lib/stores/authStore";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DialogType =
  | null
  | "update-name"
  | "update-industry"
  | "update-location"
  | "delete-business";

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { profile, isLoading } = useProfile();
  const { updateName, updateIndustry, updateLocation, deleteBusiness } =
    useBusiness();
  const { signOut } = useAuth();

  const [dialog, setDialog] = useState<DialogType>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    industry: "",
    location: "",
    confirm: "",
  });

  if (user?.role !== "ADMIN") return null;
  if (isLoading || !profile?.businessId) return null;

  const openDialog = (type: DialogType) => {
    setDialog(type);
    if (type === "update-name")
      setForm((f) => ({ ...f, name: profile.businessName || "" }));
    if (type === "update-industry")
      setForm((f) => ({ ...f, industry: profile.industry || "" }));
    if (type === "update-location")
      setForm((f) => ({ ...f, location: profile.location || "" }));
    if (type === "delete-business") setForm((f) => ({ ...f, confirm: "" }));
  };

  const closeDialog = () => {
    setDialog(null);
    setSaving(false);
    setDeleting(false);
  };

  async function handleUpdateName() {
    const trimmed = form.name.trim();
    if (!trimmed) return;
    if (trimmed === profile?.businessName) {
      closeDialog();
      return;
    }
    setSaving(true);
    try {
      await updateName.mutateAsync({ name: trimmed });
      toast.success("Business name updated");
      closeDialog();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to update name");
      setSaving(false);
    }
  }

  async function handleUpdateIndustry() {
    const trimmed = form.industry.trim();
    if (!trimmed) return;
    if (trimmed === profile?.industry) {
      closeDialog();
      return;
    }
    setSaving(true);
    try {
      await updateIndustry.mutateAsync({ industry: trimmed });
      toast.success("Business industry updated");
      closeDialog();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to update industry");
      setSaving(false);
    }
  }

  async function handleUpdateLocation() {
    const trimmed = form.location.trim();
    if (!trimmed) return;
    if (trimmed === profile?.location) {
      closeDialog();
      return;
    }
    setSaving(true);
    try {
      await updateLocation.mutateAsync({ location: trimmed });
      toast.success("Business location updated");
      closeDialog();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to update location");
      setSaving(false);
    }
  }

  async function handleDeleteBusiness() {
    if (form.confirm !== profile?.businessName) {
      toast.error("Business name does not match");
      return;
    }
    setDeleting(true);
    try {
      await deleteBusiness.mutateAsync();
      await signOut.mutateAsync();
      toast.success("Business deleted");
      router.push("/");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to delete business");
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold">
            Business Settings
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Business Name</p>
              <p className="text-sm text-muted-foreground">
                {profile.businessName}
              </p>
            </div>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => openDialog("update-name")}
            >
              Update
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Industry</p>
              <p className="text-sm text-muted-foreground">
                {profile.industry || "Not set"}
              </p>
            </div>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => openDialog("update-industry")}
            >
              Update
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Location</p>
              <p className="text-sm text-muted-foreground">
                {profile.location || "Not set"}
              </p>
            </div>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => openDialog("update-location")}
            >
              Update
            </Button>
          </div>

          <div className="pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-600">Delete Business</p>
                <p className="text-sm text-muted-foreground">
                  Permanently remove all business data
                </p>
              </div>
              <Button
                variant="destructive"
                className="cursor-pointer"
                onClick={() => openDialog("delete-business")}
              >
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialog !== null} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "update-name" && "Update Business Name"}
              {dialog === "update-industry" && "Update Industry"}
              {dialog === "update-location" && "Update Location"}
              {dialog === "delete-business" && "Delete Business"}
            </DialogTitle>
          </DialogHeader>

          {dialog === "update-name" && (
            <>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Business name"
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={closeDialog}
                  disabled={saving}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateName}
                  disabled={saving}
                  className="cursor-pointer"
                >
                  {saving ? "Updating..." : "Update"}
                </Button>
              </DialogFooter>
            </>
          )}

          {dialog === "update-industry" && (
            <>
              <Input
                value={form.industry}
                onChange={(e) =>
                  setForm((f) => ({ ...f, industry: e.target.value }))
                }
                placeholder="Industry"
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={closeDialog}
                  disabled={saving}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateIndustry}
                  disabled={saving}
                  className="cursor-pointer"
                >
                  {saving ? "Updating..." : "Update"}
                </Button>
              </DialogFooter>
            </>
          )}

          {dialog === "update-location" && (
            <>
              <Input
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                placeholder="Location"
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={closeDialog}
                  disabled={saving}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateLocation}
                  disabled={saving}
                  className="cursor-pointer"
                >
                  {saving ? "Updating..." : "Update"}
                </Button>
              </DialogFooter>
            </>
          )}

          {dialog === "delete-business" && (
            <>
              <p className="text-sm text-muted-foreground">
                Enter your business name to confirm deletion:
              </p>

              <Input
                value={form.confirm}
                onChange={(e) =>
                  setForm((f) => ({ ...f, confirm: e.target.value }))
                }
                placeholder={profile?.businessName ?? ""}
              />

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={closeDialog}
                  disabled={deleting}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteBusiness}
                  disabled={deleting}
                  className="cursor-pointer"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
