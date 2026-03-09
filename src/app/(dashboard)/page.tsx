"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Plus, FolderKanban, Users, CheckSquare } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const { workspaces, isLoading } = useWorkspaces();
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();

  useEffect(() => {
    if (workspaces.length > 0 && !currentWorkspace) {
      setCurrentWorkspace(workspaces[0]);
    }
  }, [workspaces, currentWorkspace, setCurrentWorkspace]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <EmptyState
          icon={<FolderKanban className="h-12 w-12" />}
          title="Welcome to ProjectSphere"
          description="Create your first workspace to get started with project management"
          action={
            <Button asChild>
              <Link href="/workspaces/new">
                <Plus className="mr-2 h-4 w-4" />
                Create workspace
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your workspaces.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((workspace) => (
          <Card
            key={workspace.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => {
              setCurrentWorkspace(workspace);
              router.push(`/workspaces/${workspace.id}`);
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-primary" />
                {workspace.name}
              </CardTitle>
              <CardDescription>{workspace.description || "No description"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{workspace.role}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="flex cursor-pointer items-center justify-center border-dashed transition-colors hover:border-primary/50 hover:bg-muted/50">
          <Link href="/workspaces/new" className="flex flex-col items-center gap-2 p-6">
            <Plus className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Create new workspace</span>
          </Link>
        </Card>
      </div>
    </div>
  );
}
