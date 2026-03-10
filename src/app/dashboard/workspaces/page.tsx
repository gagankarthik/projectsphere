"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { WorkspaceCard } from "@/components/workspace/workspace-card";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Plus, LayoutGrid } from "lucide-react";
import Link from "next/link";

export default function WorkspacesPage() {
  const router = useRouter();
  const { workspaces, isLoading } = useWorkspaces();
  const { setCurrentWorkspace } = useWorkspaceStore();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-28 rounded-xl bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 p-5 sm:p-8 text-white">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-1/4 h-32 w-64 rounded-full bg-white/5 blur-xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-purple-200 text-sm mb-2">
              <LayoutGrid className="h-4 w-4" />
              <span>All Workspaces</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Workspaces</h1>
            <p className="mt-1 text-purple-100/80 text-sm">
              {workspaces.length > 0
                ? `You're a member of ${workspaces.length} workspace${workspaces.length !== 1 ? "s" : ""}`
                : "Create a workspace to start collaborating"}
            </p>
          </div>
          <Button
            asChild
            className="self-start bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
          >
            <Link href="/dashboard/workspaces/new">
              <Plus className="mr-2 h-4 w-4" />
              New Workspace
            </Link>
          </Button>
        </div>
      </div>

      {workspaces.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="h-12 w-12" />}
          title="No workspaces yet"
          description="Create your first workspace to start managing projects with your team."
          action={
            <Button asChild>
              <Link href="/dashboard/workspaces/new">
                <Plus className="mr-2 h-4 w-4" />
                Create workspace
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              workspace={workspace}
              onClick={() => {
                setCurrentWorkspace(workspace);
                router.push(`/dashboard/workspaces/${workspace.id}`);
              }}
            />
          ))}
          <Link href="/dashboard/workspaces/new">
            <div className="flex h-full min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed text-muted-foreground transition-all hover:border-violet-400 hover:text-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-950/20">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed">
                <Plus className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">New Workspace</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
