"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ProjectCard } from "@/components/project/project-card";
import { useProjects } from "@/hooks/use-projects";
import { Plus, FolderKanban } from "lucide-react";
import Link from "next/link";

interface ProjectsPageProps {
  params: Promise<{ workspaceId: string }>;
}

export default function ProjectsPage({ params }: ProjectsPageProps) {
  const { workspaceId } = use(params);
  const router = useRouter();
  const { projects, isLoading } = useProjects(workspaceId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-24 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-700 p-5 sm:p-7 text-white">
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-200 text-sm mb-1">
              <FolderKanban className="h-4 w-4" />
              Projects
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">All Projects</h1>
            <p className="mt-1 text-blue-100/80 text-sm">
              {projects.length} project{projects.length !== 1 ? "s" : ""} in this workspace
            </p>
          </div>
          <Button
            asChild
            className="self-start bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
          >
            <Link href={`/dashboard/workspaces/${workspaceId}/projects/new`}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-12 w-12" />}
          title="No projects yet"
          description="Create your first project to start managing tasks"
          action={
            <Button asChild>
              <Link href={`/dashboard/workspaces/${workspaceId}/projects/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Create project
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() =>
                router.push(`/dashboard/workspaces/${workspaceId}/projects/${project.id}/board`)
              }
            />
          ))}
          <Link href={`/dashboard/workspaces/${workspaceId}/projects/new`}>
            <div className="flex h-full min-h-[140px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed text-muted-foreground transition-all hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed">
                <Plus className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">New Project</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
