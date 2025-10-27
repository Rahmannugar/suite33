"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/authStore";
import axios from "axios";
import { UserSchema, User } from "../types/user";
import { useEffect } from "react";
import { z } from "zod";

export function useProfile() {
  const { user, setUser } = useAuthStore();

  const query = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data } = await axios.get("/api/user/profile");
      const result = UserSchema.safeParse(data);
      if (!result.success) throw new Error("Invalid user profile data");
      return result.data as User;
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    enabled: true,
  });

  useEffect(() => {
    if (query.data) {
      setUser({
        id: query.data.id,
        email: query.data.email,
        role: query.data.role,
        fullName: query.data.fullName,
        businessId: query.data.businessId,
        businessName: query.data.businessName,
        avatarUrl: query.data.avatarUrl,
        departmentId: query.data.departmentId,
        departmentName: query.data.departmentName,
      });
    }
  }, [query.data, setUser]);

  return {
    profile: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
