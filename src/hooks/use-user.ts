"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User, UserUpdateInput } from "@/types/user";

async function fetchCurrentUser(): Promise<User> {
  const response = await fetch("/api/auth/me");
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to fetch user");
  }

  return data.data;
}

async function updateUser(input: UserUpdateInput): Promise<User> {
  const response = await fetch("/api/auth/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to update user");
  }

  return data.data;
}

export function useUser() {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["user"],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["user"], updatedUser);
    },
  });

  return {
    user,
    isLoading,
    error,
    refetch,
    updateUser: updateMutation.mutate,
    updateUserAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}
