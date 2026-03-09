"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskPriorityBadge } from "./task-priority-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Calendar } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/task";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "done";
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  return (
    <Card
      className={cn(
        "cursor-pointer transition-shadow hover:shadow-md",
        isDragging && "opacity-50 shadow-lg"
      )}
      onClick={onClick}
    >
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm font-medium leading-tight">
          {task.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <TaskPriorityBadge priority={task.priority} />
          {task.dueDate && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue && "text-red-600",
                isDueToday && !isOverdue && "text-orange-600",
                !isOverdue && !isDueToday && "text-muted-foreground"
              )}
            >
              <Calendar className="h-3 w-3" />
              {format(new Date(task.dueDate), "MMM d")}
            </div>
          )}
        </div>
        {task.assignee && (
          <div className="mt-2 flex items-center justify-end">
            <UserAvatar
              name={task.assignee.name}
              email={task.assignee.email}
              avatarUrl={task.assignee.avatarUrl}
              size="sm"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
