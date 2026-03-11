"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useTask } from "@/hooks/use-tasks";
import { useProject } from "@/hooks/use-projects";
import { TaskFullScreenView } from "@/components/task/task-full-screen-view";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface TaskPageProps {
  params: Promise<{
    workspaceId: string;
    projectId: string;
    taskId: string;
  }>;
}

export default function TaskPage({ params }: TaskPageProps) {
  const { workspaceId, projectId, taskId } = use(params);
  const router = useRouter();
  const { task, isLoading: taskLoading } = useTask(taskId);
  const { project, isLoading: projectLoading } = useProject(projectId);

  if (taskLoading || projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-muted-foreground">Task not found</p>
        <Button asChild variant="outline">
          <Link href={`/dashboard/workspaces/${workspaceId}/projects/${projectId}/board`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Board
          </Link>
        </Button>
      </div>
    );
  }

  const handleClose = () => {
    router.push(`/dashboard/workspaces/${workspaceId}/projects/${projectId}/board`);
  };

  return (
    <TaskFullScreenView
      taskId={taskId}
      workspaceId={workspaceId}
      projectId={projectId}
      projectKey={project?.key}
      onClose={handleClose}
    />
  );
}
