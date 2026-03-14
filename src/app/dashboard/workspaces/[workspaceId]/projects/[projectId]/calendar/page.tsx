"use client";

import { use, useState, useMemo } from "react";
import { ProjectHeader } from "@/components/project/project-header";
import { TaskDetail } from "@/components/task/task-detail";
import { CreateTaskSheet } from "@/components/task/create-task-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useTasks } from "@/hooks/use-tasks";
import { useProject } from "@/hooks/use-projects";
import { toast } from "sonner";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types/task";
import type { CreateTaskInput } from "@/validations/task";
import Link from "next/link";

interface CalendarPageProps {
  params: Promise<{ workspaceId: string; projectId: string }>;
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "bg-slate-100 text-slate-600 border-slate-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  in_review: "bg-amber-100 text-amber-700 border-amber-200",
  done: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const STATUS_DOTS: Record<TaskStatus, string> = {
  todo: "bg-slate-400",
  in_progress: "bg-blue-500",
  in_review: "bg-amber-500",
  done: "bg-emerald-500",
};

export default function CalendarPage({ params }: CalendarPageProps) {
  const { workspaceId, projectId } = use(params);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { project, isLoading: projectLoading } = useProject(projectId);
  const { tasks, isLoading: tasksLoading, createTaskAsync, isCreating } = useTasks(projectId);

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group tasks by due date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((task) => {
      if (task.dueDate) {
        const key = format(new Date(task.dueDate), "yyyy-MM-dd");
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(task);
      }
    });
    return map;
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

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setCreateDialogOpen(true);
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
      <ProjectHeader project={project} workspaceId={workspaceId} currentView="calendar" />

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
        <Button size="sm" className="h-8 gap-1.5" onClick={() => { setSelectedDate(null); setCreateDialogOpen(true); }}>
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New Task</span>
        </Button>
      </div>

      {/* Calendar */}
      {tasksLoading ? (
        <Skeleton className="h-[600px] w-full rounded-xl" />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="px-2 py-2 text-center text-xs font-medium text-slate-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayTasks = tasksByDate.get(dateKey) || [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isDayToday = isToday(day);

              return (
                <div
                  key={idx}
                  className={cn(
                    "min-h-24 p-1 border-r border-b border-slate-100 last:border-r-0 transition-colors",
                    !isCurrentMonth && "bg-slate-50/50",
                    isDayToday && "bg-blue-50/50",
                    "hover:bg-slate-50 cursor-pointer"
                  )}
                  onClick={() => handleDayClick(day)}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between px-1 mb-1">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        !isCurrentMonth && "text-slate-300",
                        isCurrentMonth && !isDayToday && "text-slate-600",
                        isDayToday && "text-blue-600 font-bold"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] text-slate-400">{dayTasks.length}</span>
                    )}
                  </div>

                  {/* Tasks */}
                  <div className="space-y-0.5 overflow-hidden max-h-20">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] truncate cursor-pointer hover:opacity-80",
                          STATUS_COLORS[task.status]
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskClick(task);
                        }}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", STATUS_DOTS[task.status])} />
                        <span className="truncate">{task.title}</span>
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-[10px] text-slate-400 px-1.5">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="font-medium">Status:</span>
        {(["todo", "in_progress", "in_review", "done"] as TaskStatus[]).map((status) => (
          <div key={status} className="flex items-center gap-1">
            <span className={cn("w-2 h-2 rounded-full", STATUS_DOTS[status])} />
            <span className="capitalize">{status.replace("_", " ")}</span>
          </div>
        ))}
      </div>

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
        defaultDueDate={selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined}
      />
    </div>
  );
}
