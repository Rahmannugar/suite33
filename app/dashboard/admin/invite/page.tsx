"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/authStore";
import axios from "axios";
import { validateEmail } from "@/lib/utils/validation";
import { toast } from "sonner";
import Link from "next/link";
import emailjs from "@emailjs/browser";

export default function StaffInvitePage() {
  const user = useAuthStore((s) => s.user);
  const [email, setEmail] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [emailError, setEmailError] = useState("");

  const sendInvite = useMutation({
    mutationFn: async () => {
      const res = await axios.post("/api/invite", {
        email,
        departmentName,
        businessId: user?.businessId,
        adminId: user?.id,
      });
      const { invite } = res.data;

      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        {
          to_email: email,
          invite_url: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/invite?token=${invite.token}`,
          business_name: user?.businessName ?? "",
          department_name: departmentName ?? "",
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      );

      return invite;
    },
    onSuccess: () => {
      toast.success("Invite sent successfully!");
      setEmail("");
      setDepartmentName("");
    },
    onError: (err: any) => {
      // Show quota error
      if (
        err?.response?.data?.error &&
        err.response.data.error.toLowerCase().includes("invite limit")
      ) {
        toast.error(
          "Monthly quota of 10 invites reached. Please try again next month."
        );
      } else {
        toast.error(err?.response?.data?.error || "Failed to send invite");
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateEmail(email)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError("");
    sendInvite.mutate();
  }

  const canInvite = !!user?.businessId;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md rounded-2xl border border-[--border] bg-[--card] text-[--card-foreground] shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-center mb-1">
          Invite a <span className="text-[--primary]">Team Member</span>
        </h1>
        <p className="text-sm text-[--muted-foreground] text-center mb-8">
          Enter their email and department.
        </p>
        {!canInvite && (
          <div className="mb-4 flex flex-col items-center gap-2">
            <p className="text-sm text-red-500 text-center">
              Complete your business setup before inviting staff.
            </p>
            <Link
              href="/onboarding/admin"
              className="text-blue-500 text-sm underline"
            >
              Go to Business Onboarding
            </Link>
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
            <p className="text-xs text-red-500 mt-1">{emailError}</p>
          )}
          <input
            type="text"
            placeholder="Department (optional)"
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
            className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-blue-500 outline-none transition pr-10"
            disabled={!canInvite}
          />

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
