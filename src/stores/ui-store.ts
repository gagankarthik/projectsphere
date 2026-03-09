import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  taskDetailOpen: boolean;
  selectedTaskId: string | null;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openTaskDetail: (taskId: string) => void;
  closeTaskDetail: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  taskDetailOpen: false,
  selectedTaskId: null,

  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    })),

  setSidebarOpen: (open) =>
    set({
      sidebarOpen: open,
    }),

  setSidebarCollapsed: (collapsed) =>
    set({
      sidebarCollapsed: collapsed,
    }),

  openTaskDetail: (taskId) =>
    set({
      taskDetailOpen: true,
      selectedTaskId: taskId,
    }),

  closeTaskDetail: () =>
    set({
      taskDetailOpen: false,
      selectedTaskId: null,
    }),
}));
