"use client";

import { useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

// Module-level tracking to prevent multiple hook instances from fetching
let isFetching = false;
let hasFetchedOnce = false;

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    hasFetched,
    setUser,
    setLoading,
    logout: clearAuth,
  } = useAuthStore();
  const { reset: resetWorkspaces } = useWorkspaceStore();

  const fetchUser = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetching) return;

    isFetching = true;
    setLoading(true);

    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.success && data.data ? data.data : null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      isFetching = false;
      hasFetchedOnce = true;
    }
  }, [setUser, setLoading]);

  const logout = useCallback(() => {
    // Reset module-level tracking on logout
    hasFetchedOnce = false;
    clearAuth();
    resetWorkspaces();
    window.location.href = "/auth/logout";
  }, [clearAuth, resetWorkspaces]);

  // Fetch user on initial mount - only once across all instances
  useEffect(() => {
    // Skip if store says already fetched, or if we've already fetched this session
    if (hasFetched || hasFetchedOnce || isFetching) {
      return;
    }
    fetchUser();
  }, [hasFetched, fetchUser]);

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
    refetch: fetchUser
  };
}
