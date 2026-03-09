"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getTaskPriorityLabel, getTaskPriorityIcon } from "@/constants/task-priority";
import type { TaskPriority } from "@/types/task";

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export function TaskPriorityBadge({ priority, className }: TaskPriorityBadgeProps) {
  const colorMap: Record<TaskPriority, string> = {
    low: "bg-gray-100 text-gray-700 hover:bg-gray-100",
    medium: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    high: "bg-orange-100 text-orange-700 hover:bg-orange-100",
    urgent: "bg-red-100 text-red-700 hover:bg-red-100",
  };

  return (
    <Badge variant="secondary" className={cn(colorMap[priority], className)}>
      <span className="mr-1">{getTaskPriorityIcon(priority)}</span>
      {getTaskPriorityLabel(priority)}
    </Badge>
  );
}
