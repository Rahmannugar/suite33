"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { useSidebarStore } from "@/lib/stores/sidebarStore";
import { useStaffInvite } from "@/lib/hooks/invite/useStaffInvite";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function StaffInvitePage() {
  const user = useAuthStore((state) => state.user);
  const collapsed = useSidebarStore((state) => state.collapsed);
  const router = useRouter();
  const {
    email,
    setEmail,
    departmentName,
    setDepartmentName,
    role,
    setRole,
    emailError,
    handleSubmit,
    sendInvite,
  } = useStaffInvite(user?.businessName ?? undefined);

  const canInvite = !!user?.businessId;
  const leftClass = collapsed ? "md:left-24" : "md:left-[272px]";

  const navigateFn = () => {
    router.push("/dashboard/admin/organization");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative">
      <button
        type="button"
        onClick={navigateFn}
        className={`fixed top-24 left-7 ${leftClass} p-2 rounded-full border border-[--border] hover:bg-[--muted] transition-all hover:scale-95 cursor-pointer z-30`}
        aria-label="Go back"
      >
        <ArrowLeft size={20} />
      </button>

      <div className="w-full max-w-md rounded-2xl border border-[--border] bg-[--card] text-[--card-foreground] shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-center mb-1">
          Invite a <span className="text-[--primary]">Team Member</span>
        </h1>
        <p className="text-sm text-[--muted-foreground] text-center mb-8">
          Enter their email, department, and role.
        </p>
        {!canInvite && (
          <div className="mb-4 flex flex-col items-center gap-2">
            <span className="text-sm text-red-500">
              You must create a business before inviting staff.
            </span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Staff email address *"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition pr-10"
            disabled={!canInvite}
          />
          {emailError && (
            <div className="text-xs text-red-500">{emailError}</div>
          )}
          <input
            type="text"
            placeholder="Department (optional)"
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
            className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition pr-10"
            disabled={!canInvite}
          />
          <Select
            value={role}
            onValueChange={(v) => setRole(v as "STAFF" | "SUB_ADMIN")}
            disabled={!canInvite}
          >
            <SelectTrigger className="w-full rounded-lg border border-[--input] bg-transparent px-3 py-6 focus:ring-2 focus:ring-blue-500 outline-none transition font-medium">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-50">
              <SelectItem value="STAFF">Staff</SelectItem>
              <SelectItem value="SUB_ADMIN">Assistant Admin</SelectItem>
            </SelectContent>
          </Select>

          <button
            type="submit"
            className={`w-full rounded-lg bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 transition ${
              sendInvite.isPending || !canInvite
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
            disabled={sendInvite.isPending || !canInvite}
          >
            {sendInvite.isPending ? "Sending..." : "Send Invite"}
          </button>
        </form>
      </div>
    </div>
  );
}
