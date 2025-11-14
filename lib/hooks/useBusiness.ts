import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export function useBusiness() {
  const queryClient = useQueryClient();

  const updateName = useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      await axios.put("/api/business/update-name", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });

  const updateIndustry = useMutation({
    mutationFn: async ({ industry }: { industry: string }) => {
      await axios.put("/api/business/update-industry", { industry });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });

  const updateLocation = useMutation({
    mutationFn: async ({ location }: { location: string }) => {
      await axios.put("/api/business/update-location", { location });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });

  const deleteBusiness = useMutation({
    mutationFn: async () => {
      await axios.delete("/api/business");
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["user-profile"] });
    },
  });

  return {
    updateName,
    updateIndustry,
    updateLocation,
    deleteBusiness,
  };
}
