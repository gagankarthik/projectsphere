"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Task, TaskStatus, TaskFilters } from "@/types/task";
import type { CreateTaskInput, UpdateTaskInput, ReorderTaskInput } from "@/validations/task";

async function fetchProjectTasks(projectId: string, filters?: TaskFilters): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters?.status && filters.status.length > 0) {
    params.set("status", filters.status.join(","));
  }
  if (filters?.priority && filters.priority.length > 0) {
    params.set("priority", filters.priority.join(","));
  }
  if (filters?.assigneeId) {
    params.set("assigneeId", filters.assigneeId);
  }
  if (filters?.search) {
    params.set("search", filters.search);
  }

  const url = `/api/projects/${projectId}/tasks${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to fetch tasks");
  }

  return data.data;
}

async function createTask(projectId: string, input: CreateTaskInput): Promise<Task> {
  const response = await fetch(`/api/projects/${projectId}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to create task");
  }

  return data.data;
}

async function fetchTask(taskId: string): Promise<Task> {
  const response = await fetch(`/api/tasks/${taskId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to fetch task");
  }

  return data.data;
}

async function updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to update task");
  }

  return data.data;
}

async function deleteTask(taskId: string): Promise<void> {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || "Failed to delete task");
  }
}

async function reorderTask(taskId: string, input: ReorderTaskInput): Promise<Task> {
  const response = await fetch(`/api/tasks/${taskId}/reorder`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to reorder task");
  }

  return data.data;
}

async function fetchSubtasks(taskId: string): Promise<Task[]> {
  const response = await fetch(`/api/tasks/${taskId}/subtasks`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to fetch subtasks");
  }

  return data.data;
}

async function createSubtask(taskId: string, title: string): Promise<Task> {
  const response = await fetch(`/api/tasks/${taskId}/subtasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to create subtask");
  }

  return data.data;
}

export function useTasks(projectId: string, filters?: TaskFilters) {
  const queryClient = useQueryClient();

  const {
    data: tasks = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tasks", projectId, filters],
    queryFn: () => fetchProjectTasks(projectId, filters),
    enabled: !!projectId,
    staleTime: 1 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: ReorderTaskInput }) =>
      reorderTask(taskId, input),
    onMutate: async ({ taskId, input }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks", projectId, filters]);

      // Optimistically update
      if (previousTasks) {
        const newTasks = previousTasks.map((task) => {
          if (task.id === taskId) {
            return { ...task, status: input.status, order: input.order };
          }
          return task;
        });
        queryClient.setQueryData(["tasks", projectId, filters], newTasks);
      }

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", projectId, filters], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });

  // Group tasks by status for Kanban
  const tasksByStatus = tasks.reduce(
    (acc, task) => {
      if (!acc[task.status]) {
        acc[task.status] = [];
      }
      acc[task.status].push(task);
      return acc;
    },
    {} as Record<TaskStatus, Task[]>
  );

  return {
    tasks,
    tasksByStatus,
    isLoading,
    error,
    refetch,
    createTask: createMutation.mutate,
    createTaskAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    reorderTask: reorderMutation.mutate,
    reorderTaskAsync: reorderMutation.mutateAsync,
    isReordering: reorderMutation.isPending,
  };
}

export function useTask(taskId: string) {
  const queryClient = useQueryClient();

  const {
    data: task,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => fetchTask(taskId),
    enabled: !!taskId,
    staleTime: 1 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateTaskInput) => updateTask(taskId, input),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(["task", taskId], updatedTask);
      queryClient.invalidateQueries({ queryKey: ["tasks", updatedTask.projectId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.removeQueries({ queryKey: ["task", taskId] });
    },
  });

  return {
    task,
    isLoading,
    error,
    refetch,
    updateTask: updateMutation.mutate,
    updateTaskAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteTask: deleteMutation.mutate,
    deleteTaskAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

export function useSubtasks(taskId: string) {
  const queryClient = useQueryClient();

  const {
    data: subtasks = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["subtasks", taskId],
    queryFn: () => fetchSubtasks(taskId),
    enabled: !!taskId,
    staleTime: 1 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (title: string) => createSubtask(taskId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtasks", taskId] });
    },
  });

  return {
    subtasks,
    isLoading,
    error,
    refetch,
    createSubtask: createMutation.mutate,
    createSubtaskAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
