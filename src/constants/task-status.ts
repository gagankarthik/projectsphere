import type { TaskStatus } from "@/types/task";

export const TASK_STATUSES: { value: TaskStatus; label: string; color: string }[] = [
  { value: "todo", label: "To Do", color: "bg-gray-500" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-500" },
  { value: "in_review", label: "In Review", color: "bg-yellow-500" },
  { value: "done", label: "Done", color: "bg-green-500" },
];

export const TASK_STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "in_review", "done"];

export function getTaskStatusLabel(status: TaskStatus): string {
  return TASK_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function getTaskStatusColor(status: TaskStatus): string {
  return TASK_STATUSES.find((s) => s.value === status)?.color ?? "bg-gray-500";
}
