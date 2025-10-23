"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/authStore";
import axios from "axios";
import { validateEmail } from "@/lib/utils/validation";

export default function StaffInvitePage() {
  const user = useAuthStore((s) => s.user);
  const [email, setEmail] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [emailError, setEmailError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const sendInvite = useMutation({
    mutationFn: async () => {
      const res = await axios.post("/api/invite", {
        email,
        departmentName,
        businessId: user?.businessId,
      });
      return res.data;
    },
    onSuccess: () => {
      setSuccessMsg("Invite sent successfully! Check your email.");
      setEmail("");
      setDepartmentName("");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMsg("");
    if (!validateEmail(email)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError("");
    sendInvite.mutate();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md rounded-2xl border border-[--border] bg-[--card] text-[--card-foreground] shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-center mb-1">
          Invite a <span className="text-[--primary]">Team Member</span>
        </h1>
        <p className="text-sm text-[--muted-foreground] text-center mb-8">
          Enter their email and (optionally) department name.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Staff email address"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-[--ring] outline-none transition"
          />
          {emailError && (
            <p className="text-xs text-red-500 mt-1">{emailError}</p>
          )}
          <input
            type="text"
            placeholder="Department (optional)"
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
            className="block w-full rounded-lg border border-[--input] bg-transparent p-3 focus:ring-2 focus:ring-[--ring] outline-none transition"
          />

          <button
            type="submit"
            className={`w-full rounded-lg bg-blue-600 text-white py-3 font-medium hover:bg-blue-700 transition ${
              sendInvite.isPending
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
            disabled={sendInvite.isPending}
          >
            {sendInvite.isPending ? "Sending..." : "Send Invite"}
          </button>

          {successMsg && (
            <p className="text-sm text-green-500 text-center">{successMsg}</p>
          )}

          {sendInvite.isError && (
            <p className="text-sm text-red-500 text-center">
              {(sendInvite.error as Error).message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
