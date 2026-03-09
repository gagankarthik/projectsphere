"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { TaskStatusBadge } from "@/components/task/task-status-badge";
import { TaskPriorityBadge } from "@/components/task/task-priority-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { format, isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/task";

interface ListRowProps {
  task: Task;
  onClick: () => void;
}

export function ListRow({ task, onClick }: ListRowProps) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "done";
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  return (
    <TableRow className="cursor-pointer" onClick={onClick}>
      <TableCell className="font-medium">{task.title}</TableCell>
      <TableCell>
        <TaskStatusBadge status={task.status} />
      </TableCell>
      <TableCell>
        <TaskPriorityBadge priority={task.priority} />
      </TableCell>
      <TableCell>
        {task.assignee ? (
          <div className="flex items-center gap-2">
            <UserAvatar
              name={task.assignee.name}
              email={task.assignee.email}
              avatarUrl={task.assignee.avatarUrl}
              size="sm"
            />
            <span className="text-sm">{task.assignee.name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        )}
      </TableCell>
      <TableCell>
        {task.dueDate ? (
          <span
            className={cn(
              isOverdue && "text-red-600 font-medium",
              isDueToday && !isOverdue && "text-orange-600",
              !isOverdue && !isDueToday && "text-muted-foreground"
            )}
          >
            {format(new Date(task.dueDate), "MMM d, yyyy")}
          </span>
        ) : (
          <span className="text-muted-foreground">No due date</span>
        )}
      </TableCell>
    </TableRow>
  );
}
