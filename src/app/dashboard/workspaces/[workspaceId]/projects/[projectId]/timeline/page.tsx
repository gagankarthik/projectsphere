"use client";

import { use, useState, useMemo } from "react";
import { ProjectHeader } from "@/components/project/project-header";
import { TaskDetail } from "@/components/task/task-detail";
import { CreateTaskSheet } from "@/components/task/create-task-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, GanttChart, ChevronLeft, ChevronRight } from "lucide-react";
import { useTasks } from "@/hooks/use-tasks";
import { useProject } from "@/hooks/use-projects";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, differenceInDays, startOfDay, isBefore, isAfter } from "date-fns";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types/task";
import type { CreateTaskInput } from "@/validations/task";
import Link from "next/link";

interface TimelinePageProps {
  params: Promise<{ workspaceId: string; projectId: string }>;
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "bg-slate-400",
  in_progress: "bg-blue-500",
  in_review: "bg-amber-500",
  done: "bg-emerald-500",
};

export default function TimelinePage({ params }: TimelinePageProps) {
  const { workspaceId, projectId } = use(params);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { project, isLoading: projectLoading } = useProject(projectId);
  const { tasks, isLoading: tasksLoading, createTaskAsync, isCreating } = useTasks(projectId);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Tasks with due dates for timeline
  const timelineTasks = useMemo(() => {
    return tasks
      .filter((t) => t.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  }, [tasks]);

  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
    setTaskDetailOpen(true);
  };

  const handleCreateTask = async (_pid: string, data: CreateTaskInput) => {
    try {
      await createTaskAsync(data);
      toast.success("Task created");
    } catch {
      toast.error("Failed to create task");
    }
  };

  const getTaskPosition = (task: Task) => {
    if (!task.dueDate) return null;
    const dueDate = startOfDay(new Date(task.dueDate));
    const dayIndex = differenceInDays(dueDate, monthStart);

    if (dayIndex < 0 || dayIndex >= days.length) return null;

    return {
      left: `${(dayIndex / days.length) * 100}%`,
      width: "auto",
    };
  };

  if (projectLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        description="The project you're looking for doesn't exist."
        action={
          <Button asChild>
            <Link href={`/dashboard/workspaces/${workspaceId}/projects`}>Back to projects</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ProjectHeader project={project} workspaceId={workspaceId} currentView="timeline" />

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-slate-700 min-w-32 text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setCurrentMonth(new Date())}>
            Today
          </Button>
        </div>
        <Button size="sm" className="h-8 gap-1.5" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New Task</span>
        </Button>
      </div>

      {/* Timeline */}
      {tasksLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : timelineTasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <GanttChart className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-slate-700 mb-1">No tasks with due dates</h3>
          <p className="text-xs text-slate-500 mb-4">Add due dates to your tasks to see them on the timeline</p>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create Task
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Days header */}
          <div className="flex border-b border-slate-100 bg-slate-50">
            <div className="w-48 shrink-0 px-3 py-2 border-r border-slate-100">
              <span className="text-xs font-medium text-slate-500">Task</span>
            </div>
            <div className="flex-1 flex overflow-x-auto">
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex-1 min-w-8 px-1 py-2 text-center border-r border-slate-100 last:border-r-0",
                    isToday(day) && "bg-blue-50"
                  )}
                >
                  <div className="text-[10px] text-slate-400">{format(day, "EEE")}</div>
                  <div className={cn(
                    "text-xs font-medium",
                    isToday(day) ? "text-blue-600" : "text-slate-600"
                  )}>
                    {format(day, "d")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Task rows */}
          <div className="divide-y divide-slate-100">
            {timelineTasks.map((task) => {
              const position = getTaskPosition(task);
              const dueDate = task.dueDate ? new Date(task.dueDate) : null;
              const isInMonth = dueDate && isSameMonth(dueDate, currentMonth);

              return (
                <div key={task.id} className="flex hover:bg-slate-50 transition-colors">
                  <div
                    className="w-48 shrink-0 px-3 py-2 border-r border-slate-100 cursor-pointer"
                    onClick={() => handleTaskClick(task)}
                  >
                    <p className="text-sm text-slate-700 truncate hover:text-blue-600">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={cn("text-[10px] h-4 px-1", STATUS_COLORS[task.status], "text-white border-0")}>
                        {task.status.replace("_", " ")}
                      </Badge>
                      {dueDate && (
                        <span className="text-[10px] text-slate-400">
                          {format(dueDate, "MMM d")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 relative min-h-12 flex items-center overflow-x-auto">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex">
                      {days.map((day) => (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "flex-1 min-w-8 border-r border-slate-100 last:border-r-0",
                            isToday(day) && "bg-blue-50/50"
                          )}
                        />
                      ))}
                    </div>
                    {/* Task marker */}
                    {isInMonth && position && (
                      <div
                        className="absolute h-6 flex items-center cursor-pointer z-10"
                        style={{ left: position.left }}
                        onClick={() => handleTaskClick(task)}
                      >
                        <div className={cn(
                          "h-2 w-2 rounded-full ring-2 ring-white",
                          STATUS_COLORS[task.status]
                        )} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedTaskId && (
        <TaskDetail
          taskId={selectedTaskId}
          open={taskDetailOpen}
          workspaceId={workspaceId}
          onOpenChange={(open) => {
            setTaskDetailOpen(open);
            if (!open) setSelectedTaskId(null);
          }}
        />
      )}

      <CreateTaskSheet
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateTask}
        isSubmitting={isCreating}
        workspaceId={workspaceId}
        projectId={projectId}
      />
    </div>
  );
}
