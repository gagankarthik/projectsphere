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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useProjects } from "@/hooks/use-projects";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  Home,
  FolderKanban,
  Settings,
  Users,
  Plus,
  LayoutDashboard,
  CheckSquare,
  ChevronRight,
} from "lucide-react";

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const { workspaces, isLoading: workspacesLoading } = useWorkspaces();

  const workspaceId = (params?.workspaceId as string) || currentWorkspace?.id;
  const { projects, isLoading: projectsLoading } = useProjects(workspaceId || "");

  const isActive = (path: string) => pathname === path;
  const isProjectActive = (projectId: string) =>
    pathname.includes(`/projects/${projectId}`);
  const isTasksActive = () => pathname.includes("/tasks");

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
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
                  <Link href="/dashboard">
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {workspaceId && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isTasksActive()}
                  >
                    <Link href={`/dashboard/workspaces/${workspaceId}/tasks`}>
                      <CheckSquare className="h-4 w-4" />
                      <span>All Tasks</span>
                      {totalTasks > 0 && (
                        <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0">
                          {totalTasks}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Workspaces */}
        <SidebarGroup>
          <div className="flex items-center justify-between px-2">
            <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
            <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
              <Link href="/dashboard/workspaces/new">
                <Plus className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspacesLoading ? (
                <>
                  <SidebarMenuItem>
                    <Skeleton className="h-8 w-full" />
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Skeleton className="h-8 w-full" />
                  </SidebarMenuItem>
                </>
              ) : workspaces.length === 0 ? (
                <SidebarMenuItem>
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">
                    No workspaces yet
                  </p>
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
                        {workspaceId === ws.id && (
                          <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Current Workspace Details */}
        {workspaceId && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(`/dashboard/workspaces/${workspaceId}`)}
                    >
                      <Link href={`/dashboard/workspaces/${workspaceId}`}>
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Overview</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
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
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(`/dashboard/workspaces/${workspaceId}/settings`)}
                    >
                      <Link href={`/dashboard/workspaces/${workspaceId}/settings`}>
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Projects */}
            <SidebarGroup>
              <div className="flex items-center justify-between px-2">
                <SidebarGroupLabel>Projects</SidebarGroupLabel>
                <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                  <Link href={`/dashboard/workspaces/${workspaceId}/projects/new`}>
                    <Plus className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
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
                  ) : projects.length === 0 ? (
                    <SidebarMenuItem>
                      <p className="px-2 py-1.5 text-sm text-muted-foreground">
                        No projects yet
                      </p>
                    </SidebarMenuItem>
                  ) : (
                    projects.map((project) => (
                      <SidebarMenuItem key={project.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={isProjectActive(project.id)}
                        >
                          <Link
                            href={`/dashboard/workspaces/${workspaceId}/projects/${project.id}/board`}
                          >
                            <FolderKanban className="h-4 w-4" />
                            <span className="truncate">{project.name}</span>
                            {project.taskCount !== undefined && project.taskCount > 0 && (
                              <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
                                {project.taskCount}
                              </Badge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
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
