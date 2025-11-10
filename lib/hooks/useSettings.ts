import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export function useSettings() {
  const queryClient = useQueryClient();

  const updateSettings = useMutation({
    mutationFn: async ({
      businessId,
      name,
      industry,
      location,
    }: {
      businessId: string;
      name: string;
      industry?: string;
      location?: string;
    }) => {
      await axios.put("/api/settings", {
        businessId,
        name,
        industry,
        location,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });

  const deleteSettings = useMutation({
    mutationFn: async (businessId: string) => {
      await axios.delete("/api/settings", {
        data: { businessId },
      });
    },
  });

  return {
    updateSettings,
    deleteSettings,
  };
}
