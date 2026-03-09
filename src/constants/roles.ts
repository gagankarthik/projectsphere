import type { WorkspaceRole } from "@/types/workspace";
import type { ProjectRole } from "@/types/project";

export const WORKSPACE_ROLES: { value: WorkspaceRole; label: string; description: string }[] = [
  { value: "owner", label: "Owner", description: "Full access to workspace settings and billing" },
  { value: "admin", label: "Admin", description: "Can manage members and projects" },
  { value: "member", label: "Member", description: "Can create and edit projects and tasks" },
  { value: "viewer", label: "Viewer", description: "Can only view projects and tasks" },
];

export const PROJECT_ROLES: { value: ProjectRole; label: string; description: string }[] = [
  { value: "owner", label: "Owner", description: "Full access to project settings" },
  { value: "admin", label: "Admin", description: "Can manage members and settings" },
  { value: "member", label: "Member", description: "Can create and edit tasks" },
  { value: "viewer", label: "Viewer", description: "Can only view tasks" },
];

export const ROLE_PERMISSIONS = {
  workspace: {
    owner: ["read", "write", "delete", "manage_members", "manage_settings", "manage_billing"],
    admin: ["read", "write", "delete", "manage_members", "manage_settings"],
    member: ["read", "write"],
    viewer: ["read"],
  },
  project: {
    owner: ["read", "write", "delete", "manage_members", "manage_settings"],
    admin: ["read", "write", "delete", "manage_members"],
    member: ["read", "write"],
    viewer: ["read"],
  },
} as const;

export function canManageWorkspaceMembers(role: WorkspaceRole): boolean {
  return role === "owner" || role === "admin";
}

export function canManageWorkspaceSettings(role: WorkspaceRole): boolean {
  return role === "owner" || role === "admin";
}

export function canDeleteWorkspace(role: WorkspaceRole): boolean {
  return role === "owner";
}

export function canManageProjectMembers(role: ProjectRole): boolean {
  return role === "owner" || role === "admin";
}

export function canManageProjectSettings(role: ProjectRole): boolean {
  return role === "owner" || role === "admin";
}

export function canDeleteProject(role: ProjectRole): boolean {
  return role === "owner";
}
