"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Project, ProjectMember, ProjectRole } from "@/types/project";
import type { CreateProjectInput, UpdateProjectInput, AddProjectMemberInput } from "@/validations/project";

async function fetchWorkspaceProjects(workspaceId: string): Promise<Project[]> {
  const response = await fetch(`/api/workspaces/${workspaceId}/projects`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to fetch projects");
  }

  return data.data;
}

async function createProject(workspaceId: string, input: CreateProjectInput): Promise<Project> {
  const response = await fetch(`/api/workspaces/${workspaceId}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to create project");
  }

  return data.data;
}

async function fetchProject(projectId: string): Promise<Project> {
  const response = await fetch(`/api/projects/${projectId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to fetch project");
  }

  return data.data;
}

async function updateProject(projectId: string, input: UpdateProjectInput): Promise<Project> {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to update project");
  }

  return data.data;
}

async function deleteProject(projectId: string): Promise<void> {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || "Failed to delete project");
  }
}

async function fetchProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const response = await fetch(`/api/projects/${projectId}/members`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to fetch members");
  }

  return data.data;
}

async function addProjectMember(projectId: string, input: AddProjectMemberInput): Promise<ProjectMember> {
  const response = await fetch(`/api/projects/${projectId}/members`, {
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

async function updateProjectMemberRole(
  projectId: string,
  memberId: string,
  role: ProjectRole
): Promise<ProjectMember> {
  const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
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

async function removeProjectMember(projectId: string, memberId: string): Promise<void> {
  const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || "Failed to remove member");
  }
}

export function useProjects(workspaceId: string) {
  const queryClient = useQueryClient();

  const {
    data: projects = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: () => fetchWorkspaceProjects(workspaceId),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateProjectInput) => createProject(workspaceId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
    },
  });

  return {
    projects,
    isLoading,
    error,
    refetch,
    createProject: createMutation.mutate,
    createProjectAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function useProject(projectId: string) {
  const queryClient = useQueryClient();

  const {
    data: project,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateProjectInput) => updateProject(projectId, input),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(["project", projectId], updatedProject);
      queryClient.invalidateQueries({ queryKey: ["projects", updatedProject.workspaceId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.removeQueries({ queryKey: ["project", projectId] });
    },
  });

  return {
    project,
    isLoading,
    error,
    refetch,
    updateProject: updateMutation.mutate,
    updateProjectAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteProject: deleteMutation.mutate,
    deleteProjectAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

export function useProjectMembers(projectId: string) {
  const queryClient = useQueryClient();

  const {
    data: members = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: () => fetchProjectMembers(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });

  const addMemberMutation = useMutation({
    mutationFn: (input: AddProjectMemberInput) => addProjectMember(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: ProjectRole }) =>
      updateProjectMemberRole(projectId, memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => removeProjectMember(projectId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
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
