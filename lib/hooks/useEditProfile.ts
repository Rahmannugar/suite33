import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/authStore";
import axios from "axios";
import { uploadAvatar } from "@/lib/utils/uploadImage";

export function useEditProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      user,
      fullName,
      file,
    }: {
      user: any;
      fullName: string;
      file: File | null;
    }) => {
      let avatarUrl = user.avatarUrl;
      if (file) {
        avatarUrl = await uploadAvatar(file, user.id);
      }
      if (user.role === "ADMIN") {
        await axios.put("/api/profile/admin", {
          userId: user.id,
          fullName,
          logoUrl: avatarUrl,
        });
      } else {
        await axios.put("/api/profile/staff", {
          userId: user.id,
          fullName,
          avatarUrl,
        });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
}
