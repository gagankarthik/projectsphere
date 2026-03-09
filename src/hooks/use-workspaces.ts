"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type {
  Workspace,
  WorkspaceWithRole,
  WorkspaceMember,
  WorkspaceRole
} from "@/types/workspace";
import type { CreateWorkspaceInput, UpdateWorkspaceInput, AddMemberInput } from "@/validations/workspace";

async function fetchWorkspaces(): Promise<WorkspaceWithRole[]> {
  const response = await fetch("/api/workspaces");
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to fetch workspaces");
  }

  return data.data;
}

async function createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
  const response = await fetch("/api/workspaces", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to create workspace");
  }

  return data.data;
}

async function fetchWorkspace(workspaceId: string): Promise<Workspace> {
  const response = await fetch(`/api/workspaces/${workspaceId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to fetch workspace");
  }

  return data.data;
}

async function updateWorkspace(workspaceId: string, input: UpdateWorkspaceInput): Promise<Workspace> {
  const response = await fetch(`/api/workspaces/${workspaceId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to update workspace");
  }

  return data.data;
}

async function deleteWorkspace(workspaceId: string): Promise<void> {
  const response = await fetch(`/api/workspaces/${workspaceId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || "Failed to delete workspace");
  }
}

async function fetchWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const response = await fetch(`/api/workspaces/${workspaceId}/members`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to fetch members");
  }

  return data.data;
}

async function addWorkspaceMember(workspaceId: string, input: AddMemberInput): Promise<WorkspaceMember> {
  const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to add member");
  }

  return data.data;
}

async function updateMemberRole(
  workspaceId: string,
  memberId: string,
  role: WorkspaceRole
): Promise<WorkspaceMember> {
  const response = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to update member role");
  }

  return data.data;
}

async function removeMember(workspaceId: string, memberId: string): Promise<void> {
  const response = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || "Failed to remove member");
  }
}

export function useWorkspaces() {
  const queryClient = useQueryClient();
  const { setWorkspaces, addWorkspace, updateWorkspace: updateStoreWorkspace, removeWorkspace } = useWorkspaceStore();

  const {
    data: workspaces = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["workspaces"],
    queryFn: fetchWorkspaces,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: (newWorkspace) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      addWorkspace({ ...newWorkspace, role: "owner" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ workspaceId, input }: { workspaceId: string; input: UpdateWorkspaceInput }) =>
      updateWorkspace(workspaceId, input),
    onSuccess: (updatedWorkspace) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspace", updatedWorkspace.id] });
      updateStoreWorkspace(updatedWorkspace.id, updatedWorkspace);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWorkspace,
    onSuccess: (_, workspaceId) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      removeWorkspace(workspaceId);
    },
  });

  return {
    workspaces,
    isLoading,
    error,
    refetch,
    createWorkspace: createMutation.mutate,
    createWorkspaceAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateWorkspace: updateMutation.mutate,
    updateWorkspaceAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteWorkspace: deleteMutation.mutate,
    deleteWorkspaceAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

export function useWorkspace(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: () => fetchWorkspace(workspaceId),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useWorkspaceMembers(workspaceId: string) {
  const queryClient = useQueryClient();

  const {
    data: members = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: () => fetchWorkspaceMembers(workspaceId),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });

  const addMemberMutation = useMutation({
    mutationFn: (input: AddMemberInput) => addWorkspaceMember(workspaceId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members", workspaceId] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: WorkspaceRole }) =>
      updateMemberRole(workspaceId, memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members", workspaceId] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => removeMember(workspaceId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members", workspaceId] });
    },
  });

  return {
    members,
    isLoading,
    error,
    refetch,
    addMember: addMemberMutation.mutate,
    addMemberAsync: addMemberMutation.mutateAsync,
    isAddingMember: addMemberMutation.isPending,
    updateMemberRole: updateRoleMutation.mutate,
    updateMemberRoleAsync: updateRoleMutation.mutateAsync,
    isUpdatingRole: updateRoleMutation.isPending,
    removeMember: removeMemberMutation.mutate,
    removeMemberAsync: removeMemberMutation.mutateAsync,
    isRemovingMember: removeMemberMutation.isPending,
  };
}
