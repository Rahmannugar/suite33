import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { validatePassword } from "../utils/validation";
import axios from "axios";

export function useInvite() {
  const params = useSearchParams();
  const router = useRouter();
  const { signUp } = useAuth();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const {
    data: inviteData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["invite", token],
    queryFn: async () => {
      if (!token) throw new Error("No token provided");
      const res = await axios.get(`/api/invite/${token}`);
      return res.data;
    },
    enabled: !!token,
  });

  const invite = inviteData?.invite;

  const signupMutation = useMutation({
    mutationFn: async () => {
      if (!invite) throw new Error("No invite found");
      if (!validatePassword(password)) {
        setPasswordError(
          "Password must be at least 8 characters, include uppercase, lowercase, number, and symbol."
        );
        throw new Error("Invalid password");
      }
      setPasswordError("");

      // Sign up with Supabase
      await signUp.mutateAsync({
        email: invite.email,
        password,
      });

      // Always require email confirmation for invited users
      return { needsConfirmation: true };
    },
    onSuccess: () => {},
  });

  return {
    invite,
    isLoading,
    isError,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    passwordError,
    setPasswordError,
    signupMutation,
  };
}
