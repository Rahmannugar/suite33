"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/authStore";
import axios from "axios";
import type { User } from "../types/user";
import { useEffect } from "react";

export function useProfile() {
  const { user, setUser } = useAuthStore();

  const query = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data } = await axios.get("/api/user/profile");
      return data;
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (query.data) {
      const profile = query.data as User;
      setUser({
        id: profile.id,
        email: profile.email,
        role: profile.role,
        fullName: profile.fullName,
        businessId: profile.businessId,
        businessName: profile.businessName,
        avatarUrl: profile.avatarUrl,
        departmentId: profile.departmentId,
        departmentName: profile.departmentName,
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
