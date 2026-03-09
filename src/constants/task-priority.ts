import type { TaskPriority } from "@/types/task";

export const TASK_PRIORITIES: { value: TaskPriority; label: string; color: string; icon: string }[] = [
  { value: "low", label: "Low", color: "bg-gray-400", icon: "↓" },
  { value: "medium", label: "Medium", color: "bg-blue-400", icon: "→" },
  { value: "high", label: "High", color: "bg-orange-400", icon: "↑" },
  { value: "urgent", label: "Urgent", color: "bg-red-500", icon: "⚡" },
];

export function getTaskPriorityLabel(priority: TaskPriority): string {
  return TASK_PRIORITIES.find((p) => p.value === priority)?.label ?? priority;
}

export function getTaskPriorityColor(priority: TaskPriority): string {
  return TASK_PRIORITIES.find((p) => p.value === priority)?.color ?? "bg-gray-400";
}

export function getTaskPriorityIcon(priority: TaskPriority): string {
  return TASK_PRIORITIES.find((p) => p.value === priority)?.icon ?? "";
}
