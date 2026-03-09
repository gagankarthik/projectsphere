"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getTaskStatusLabel } from "@/constants/task-status";
import type { TaskStatus } from "@/types/task";

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  const colorMap: Record<TaskStatus, string> = {
    todo: "bg-gray-100 text-gray-700 hover:bg-gray-100",
    in_progress: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    in_review: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    done: "bg-green-100 text-green-700 hover:bg-green-100",
  };

  return (
    <Badge variant="secondary" className={cn(colorMap[status], className)}>
      {getTaskStatusLabel(status)}
    </Badge>
  );
}
