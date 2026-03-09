import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WorkspaceWithRole } from "@/types/workspace";

interface WorkspaceState {
  workspaces: WorkspaceWithRole[];
  currentWorkspace: WorkspaceWithRole | null;
  isLoading: boolean;
  setWorkspaces: (workspaces: WorkspaceWithRole[]) => void;
  setCurrentWorkspace: (workspace: WorkspaceWithRole | null) => void;
  setLoading: (loading: boolean) => void;
  addWorkspace: (workspace: WorkspaceWithRole) => void;
  updateWorkspace: (workspaceId: string, updates: Partial<WorkspaceWithRole>) => void;
  removeWorkspace: (workspaceId: string) => void;
  reset: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      currentWorkspace: null,
      isLoading: true,

      setWorkspaces: (workspaces) =>
        set({
          workspaces,
          isLoading: false,
        }),

      setCurrentWorkspace: (workspace) =>
        set({
          currentWorkspace: workspace,
        }),

      setLoading: (loading) =>
        set({
          isLoading: loading,
        }),

      addWorkspace: (workspace) =>
        set((state) => ({
          workspaces: [...state.workspaces, workspace],
        })),

      updateWorkspace: (workspaceId, updates) =>
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === workspaceId ? { ...ws, ...updates } : ws
          ),
          currentWorkspace:
            state.currentWorkspace?.id === workspaceId
              ? { ...state.currentWorkspace, ...updates }
              : state.currentWorkspace,
        })),

      removeWorkspace: (workspaceId) =>
        set((state) => ({
          workspaces: state.workspaces.filter((ws) => ws.id !== workspaceId),
          currentWorkspace:
            state.currentWorkspace?.id === workspaceId
              ? state.workspaces.find((ws) => ws.id !== workspaceId) || null
              : state.currentWorkspace,
        })),

      reset: () =>
        set({
          workspaces: [],
          currentWorkspace: null,
          isLoading: true,
        }),
    }),
    {
      name: "workspace-storage",
      partialize: (state) => ({
        currentWorkspace: state.currentWorkspace,
      }),
    }
  )
);
