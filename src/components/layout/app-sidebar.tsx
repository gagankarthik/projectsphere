"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useProjects } from "@/hooks/use-projects";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  LayoutDashboard,
  CheckSquare,
  Layers,
  Users,
  FolderKanban,
} from "lucide-react";

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const { workspaces, isLoading: workspacesLoading } = useWorkspaces();

  const workspaceId = (params?.workspaceId as string) || currentWorkspace?.id;
  const { projects, isLoading: projectsLoading } = useProjects(workspaceId || "");

  const isActive = (path: string) => pathname === path;
  const startsWithPath = (path: string) => pathname.startsWith(path);
  const isProjectActive = (projectId: string) =>
    pathname.includes(`/projects/${projectId}`);

  // Calculate total tasks across projects
  const totalTasks = projects.reduce((sum, p) => sum + (p.taskCount ?? 0), 0);

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            P
          </div>
          <span className="text-lg font-semibold">ProjectSphere</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Dashboard */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Tasks */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={workspaceId ? startsWithPath(`/dashboard/workspaces/${workspaceId}/tasks`) : false}
                >
                  <Link href={workspaceId ? `/dashboard/workspaces/${workspaceId}/tasks` : "/dashboard"}>
                    <CheckSquare className="h-4 w-4" />
                    <span>Tasks</span>
                    {totalTasks > 0 && (
                      <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0">
                        {totalTasks}
                      </Badge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Workspaces */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/dashboard/workspaces") || (workspaceId ? isActive(`/dashboard/workspaces/${workspaceId}`) : false)}
                >
                  <Link href="/dashboard/workspaces">
                    <Layers className="h-4 w-4" />
                    <span>Workspaces</span>
                    {workspaces.length > 0 && (
                      <Badge variant="outline" className="ml-auto text-xs px-1.5 py-0">
                        {workspaces.length}
                      </Badge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Members */}
              {workspaceId && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(`/dashboard/workspaces/${workspaceId}/members`)}
                  >
                    <Link href={`/dashboard/workspaces/${workspaceId}/members`}>
                      <Users className="h-4 w-4" />
                      <span>Members</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Projects */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={workspaceId ? startsWithPath(`/dashboard/workspaces/${workspaceId}/projects`) : false}
                >
                  <Link href={workspaceId ? `/dashboard/workspaces/${workspaceId}/projects` : "/dashboard"}>
                    <FolderKanban className="h-4 w-4" />
                    <span>Projects</span>
                    {projects.length > 0 && (
                      <Badge variant="outline" className="ml-auto text-xs px-1.5 py-0">
                        {projects.length}
                      </Badge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Current Workspace */}
        {workspaceId && workspaces.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Current Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {workspacesLoading ? (
                  <SidebarMenuItem>
                    <Skeleton className="h-8 w-full" />
                  </SidebarMenuItem>
                ) : (
                  workspaces.map((ws) => (
                    <SidebarMenuItem key={ws.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={workspaceId === ws.id}
                        onClick={() => setCurrentWorkspace(ws)}
                      >
                        <Link href={`/dashboard/workspaces/${ws.id}`}>
                          <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary shrink-0">
                            {ws.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="truncate">{ws.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Project List */}
        {workspaceId && projects.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {projectsLoading ? (
                  <>
                    <SidebarMenuItem>
                      <Skeleton className="h-8 w-full" />
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Skeleton className="h-8 w-full" />
                    </SidebarMenuItem>
                  </>
                ) : (
                  projects.slice(0, 5).map((project) => (
                    <SidebarMenuItem key={project.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={isProjectActive(project.id)}
                      >
                        <Link
                          href={`/dashboard/workspaces/${workspaceId}/projects/${project.id}/board`}
                        >
                          <span className="truncate text-sm">{project.name}</span>
                          {project.taskCount !== undefined && project.taskCount > 0 && (
                            <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                              {project.taskCount}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
                {projects.length > 5 && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link
                        href={`/dashboard/workspaces/${workspaceId}/projects`}
                        className="text-muted-foreground text-xs"
                      >
                        View all {projects.length} projects
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t px-4 py-3">
        <p className="text-xs text-muted-foreground">
          ProjectSphere v0.1.0
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
