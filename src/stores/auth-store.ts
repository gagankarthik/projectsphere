import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/types/auth";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasFetched: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setHasFetched: (fetched: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false, // Start with false, will be set to true when fetch starts
      hasFetched: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          hasFetched: true,
        }),

      setLoading: (loading) =>
        set({
          isLoading: loading,
        }),

      setHasFetched: (fetched) =>
        set({
          hasFetched: fetched,
        }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          hasFetched: true,
        }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // When state is rehydrated from storage, if we have a user,
        // mark as having fetched so we don't re-fetch unnecessarily
        if (state?.user) {
          state.hasFetched = true;
          state.isLoading = false;
        }
      },
    }
  )
);
