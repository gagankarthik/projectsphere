"use client";

import { use } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useWorkspace } from "@/hooks/use-workspaces";
import { useProjects } from "@/hooks/use-projects";
import { Plus, FolderKanban, Users, Settings, ArrowRight } from "lucide-react";

interface WorkspacePageProps {
  params: Promise<{ workspaceId: string }>;
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceId } = use(params);
  const { data: workspace, isLoading: workspaceLoading } = useWorkspace(workspaceId);
  const { projects, isLoading: projectsLoading } = useProjects(workspaceId);

  if (workspaceLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <EmptyState
        title="Workspace not found"
        description="The workspace you're looking for doesn't exist or you don't have access."
        action={
          <Button asChild>
            <Link href="/workspaces">View all workspaces</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{workspace.name}</h1>
          <p className="text-muted-foreground">{workspace.description || "No description"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/workspaces/${workspaceId}/settings`}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{projects.length}</div>
            <Button variant="link" className="mt-2 p-0" asChild>
              <Link href={`/workspaces/${workspaceId}/projects`}>
                View all projects
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Members</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="link" className="p-0" asChild>
              <Link href={`/workspaces/${workspaceId}/members`}>
                Manage members
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex items-center justify-center border-dashed">
          <Link
            href={`/workspaces/${workspaceId}/projects/new`}
            className="flex flex-col items-center gap-2 p-6"
          >
            <Plus className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">New Project</span>
          </Link>
        </Card>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Projects</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/workspaces/${workspaceId}/projects/new`}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>

        {projectsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={<FolderKanban className="h-10 w-10" />}
            title="No projects yet"
            description="Create your first project in this workspace"
            action={
              <Button asChild>
                <Link href={`/workspaces/${workspaceId}/projects/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create project
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <Link href={`/workspaces/${workspaceId}/projects/${project.id}/board`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FolderKanban className="h-4 w-4 text-primary" />
                      {project.name}
                    </CardTitle>
                    <CardDescription>
                      {project.key} - {project.taskCount} tasks
                    </CardDescription>
                  </CardHeader>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
