"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ListRow } from "./list-row";
import { EmptyState } from "@/components/shared/empty-state";
import { CheckSquare } from "lucide-react";
import type { Task } from "@/types/task";

interface ListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function ListView({ tasks, onTaskClick }: ListViewProps) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<CheckSquare className="h-10 w-10" />}
        title="No tasks found"
        description="Create a new task or adjust your filters"
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50%]">Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead>Due Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <ListRow key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}
      </TableBody>
    </Table>
  );
}
