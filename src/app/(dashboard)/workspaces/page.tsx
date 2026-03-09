"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { WorkspaceCard } from "@/components/workspace/workspace-card";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Plus, FolderKanban } from "lucide-react";
import Link from "next/link";

export default function WorkspacesPage() {
  const router = useRouter();
  const { workspaces, isLoading } = useWorkspaces();
  const { setCurrentWorkspace } = useWorkspaceStore();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workspaces</h1>
          <p className="text-muted-foreground">
            Manage your workspaces and collaborate with your team.
          </p>
        </div>
        <Button asChild>
          <Link href="/workspaces/new">
            <Plus className="mr-2 h-4 w-4" />
            New Workspace
          </Link>
        </Button>
      </div>

      {workspaces.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-12 w-12" />}
          title="No workspaces yet"
          description="Create your first workspace to start managing projects"
          action={
            <Button asChild>
              <Link href="/workspaces/new">
                <Plus className="mr-2 h-4 w-4" />
                Create workspace
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              workspace={workspace}
              onClick={() => {
                setCurrentWorkspace(workspace);
                router.push(`/workspaces/${workspace.id}`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
