import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import emailjs from "@emailjs/browser";
import { toast } from "sonner";
import { validateEmail } from "@/lib/utils/validation";

export function useStaffInvite(businessName: string | undefined) {
  const [email, setEmail] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [role, setRole] = useState<"STAFF" | "SUB_ADMIN">("STAFF");
  const [emailError, setEmailError] = useState("");

  const sendInvite = useMutation({
    mutationFn: async () => {
      const res = await axios.post("/api/invite", {
        email,
        departmentName,
        role,
      });
      const { invite } = res.data;

      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        {
          to_email: email,
          invite_url: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/invite?token=${invite.token}`,
          business_name: businessName ?? "",
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
      setRole("STAFF");
    },
    onError: (err: any) => {
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

  return {
    email,
    setEmail,
    departmentName,
    setDepartmentName,
    role,
    setRole,
    emailError,
    handleSubmit,
    sendInvite,
  };
}
