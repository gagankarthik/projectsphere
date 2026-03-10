"use client";

import { use, useState, useMemo } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useProjects } from "@/hooks/use-projects";
import { TaskDetail } from "@/components/task/task-detail";
import { CreateTaskDialog } from "@/components/task/create-task-dialog";
import { TaskStatusBadge } from "@/components/task/task-status-badge";
import { TaskPriorityBadge } from "@/components/task/task-priority-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckSquare,
  Plus,
  Search,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronRight,
  Calendar,
  FolderKanban,
  X,
} from "lucide-react";
import { TASK_STATUS_ORDER, TASK_STATUSES } from "@/constants/task-status";
import { format, isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types/task";
import type { Project } from "@/types/project";

const PROJECT_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-orange-500",
  "bg-pink-500", "bg-teal-500", "bg-fuchsia-500", "bg-amber-500",
];
function projectColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PROJECT_COLORS[h % PROJECT_COLORS.length];
}

type TaskWithProject = Task & { project?: Project };

const STATUS_CFG: Record<TaskStatus, { bar: string; badge: string; border: string; header: string; dot: string }> = {
  todo:        { bar: "bg-slate-400",   badge: "bg-slate-100 text-slate-600",     border: "border-t-slate-400",   header: "text-slate-700",   dot: "bg-slate-400"   },
  in_progress: { bar: "bg-blue-500",    badge: "bg-blue-100 text-blue-600",       border: "border-t-blue-500",    header: "text-blue-700",    dot: "bg-blue-500"    },
  in_review:   { bar: "bg-amber-500",   badge: "bg-amber-100 text-amber-600",     border: "border-t-amber-500",   header: "text-amber-700",   dot: "bg-amber-500"   },
  done:        { bar: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-600", border: "border-t-emerald-500", header: "text-emerald-700", dot: "bg-emerald-500" },
};

function StatusGroup({ status, tasks, onTaskClick }: { status: TaskStatus; tasks: TaskWithProject[]; onTaskClick: (task: Task) => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const statusDef = TASK_STATUSES.find((s) => s.value === status)!;
  const cfg = STATUS_CFG[status];

  return (
    <div className="mb-1">
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/50 cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className={cn("w-1 h-4 rounded-full", cfg.bar)} />
        <span className="text-muted-foreground">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
        <span className="font-semibold text-sm">{statusDef.label}</span>
        <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded-full", cfg.badge)}>
          {tasks.length}
        </span>
      </div>
      {!collapsed && (
        <div className="ml-8 border-l border-border/40">
          {tasks.length === 0 ? (
            <p className="py-3 pl-4 text-sm text-muted-foreground/60 italic">No tasks</p>
          ) : (
            tasks.map((task) => (
              <TaskListRow key={task.id} task={task} onClick={() => onTaskClick(task)} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function TaskListRow({ task, onClick }: { task: TaskWithProject; onClick: () => void }) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "done";
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));
  const color = task.project ? projectColor(task.project.id) : "bg-gray-400";

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 hover:bg-muted/40 cursor-pointer border-b border-border/30 last:border-0 group transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
            {task.title}
          </span>
          {task.labels && task.labels.length > 0 && (
            <div className="hidden sm:flex gap-1">
              {task.labels.slice(0, 2).map((l) => (
                <span key={l} className="inline-flex items-center rounded-full bg-violet-100 text-violet-700 border border-violet-200 px-1.5 py-0.5 text-[10px] font-medium">
                  {l}
                </span>
              ))}
            </div>
          )}
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5 hidden sm:block">{task.description}</p>
        )}
      </div>
      {task.project && (
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          <span className={cn("w-2 h-2 rounded-full shrink-0", color)} />
          <span className="text-xs text-muted-foreground font-mono">{task.project.key}</span>
        </div>
      )}
      <div className="shrink-0">
        <TaskPriorityBadge priority={task.priority} />
      </div>
      <div className="shrink-0 w-7">
        {task.assignee ? (
          <UserAvatar name={task.assignee.name} email={task.assignee.email} avatarUrl={task.assignee.avatarUrl} size="sm" />
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-dashed border-muted-foreground/30" />
        )}
      </div>
      <div className="shrink-0 hidden sm:block text-right w-20">
        {task.dueDate ? (
          <span className={cn("text-xs", isOverdue ? "text-red-600 font-medium" : isDueToday ? "text-orange-600" : "text-muted-foreground")}>
            <Calendar className="inline h-3 w-3 mr-0.5" />
            {format(new Date(task.dueDate), "MMM d")}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/40">—</span>
        )}
      </div>
    </div>
  );
}

interface WorkspaceTasksPageProps {
  params: Promise<{ workspaceId: string }>;
}

export default function WorkspaceTasksPage({ params }: WorkspaceTasksPageProps) {
  const { workspaceId } = use(params);
  const { projects, isLoading: projectsLoading } = useProjects(workspaceId);
  const queryClient = useQueryClient();

  const [view, setView] = useState<"list" | "board">("list");
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const taskQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: ["tasks", project.id],
      queryFn: async () => {
        const res = await fetch(`/api/projects/${project.id}/tasks`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Failed");
        return (data.data as Task[]).map((t) => ({ ...t, project }));
      },
      enabled: projects.length > 0,
      staleTime: 60 * 1000,
    })),
  });

  const isTasksLoading = taskQueries.some((q) => q.isLoading);
  const allTasks: TaskWithProject[] = taskQueries.flatMap((q) => q.data ?? []);

  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      if (selectedProject !== "all" && t.projectId !== selectedProject) return false;
      if (selectedStatus !== "all" && t.status !== selectedStatus) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!t.title.toLowerCase().includes(s) && !t.description?.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [allTasks, selectedProject, selectedStatus, search]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, TaskWithProject[]> = {
      todo: [], in_progress: [], in_review: [], done: [],
    };
    for (const task of filteredTasks) grouped[task.status]?.push(task);
    return grouped;
  }, [filteredTasks]);

  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
    setTaskDetailOpen(true);
  };

  const isLoading = projectsLoading || isTasksLoading;
  const hasFilters = !!(search || selectedProject !== "all" || selectedStatus !== "all");

  return (
    <div className="flex flex-col gap-4">
      {/* Colorful header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 p-4 sm:p-6 text-white">
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-200 text-sm mb-1">
              <CheckSquare className="h-4 w-4" />
              All Tasks
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">Tasks</h1>
            <p className="mt-0.5 text-emerald-100/80 text-sm">
              {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""} across {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start">
            <div className="flex rounded-lg overflow-hidden border border-white/20">
              <button
                onClick={() => setView("list")}
                className={cn("px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5", view === "list" ? "bg-white/20" : "hover:bg-white/10")}
              >
                <List className="h-3.5 w-3.5" /> List
              </button>
              <button
                onClick={() => setView("board")}
                className={cn("px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5", view === "board" ? "bg-white/20" : "hover:bg-white/10")}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Board
              </button>
            </div>
            {projects.length > 0 && (
              <Button
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-0 h-8"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">New Task</span>
                <span className="sm:hidden">New</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-44 sm:w-56 pl-8 h-9"
          />
        </div>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-36 sm:w-44 h-9 text-sm">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                <span className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full inline-block shrink-0", projectColor(p.id))} />
                  <span className="truncate">{p.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-32 sm:w-40 h-9 text-sm">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {TASK_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-2 text-muted-foreground"
            onClick={() => { setSearch(""); setSelectedProject("all"); setSelectedStatus("all"); }}
          >
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Content area */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-10 w-10" />}
          title="No projects yet"
          description="Create a project first, then add tasks to it."
          action={
            <Button asChild>
              <Link href={`/dashboard/workspaces/${workspaceId}/projects/new`}>
                <Plus className="mr-2 h-4 w-4" /> Create Project
              </Link>
            </Button>
          }
        />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-10 w-10" />}
          title="No tasks found"
          description={hasFilters ? "Try adjusting your filters." : "Create your first task to get started."}
          action={
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Task
            </Button>
          }
        />
      ) : view === "list" ? (
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <div className="hidden md:grid grid-cols-[1fr_120px_100px_40px_100px] gap-3 px-4 py-2.5 bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <span>Task</span>
            <span>Project</span>
            <span>Priority</span>
            <span></span>
            <span className="text-right">Due</span>
          </div>
          <div>
            {TASK_STATUS_ORDER.map((status) => (
              <StatusGroup key={status} status={status} tasks={tasksByStatus[status]} onTaskClick={handleTaskClick} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {TASK_STATUS_ORDER.map((status) => {
            const statusDef = TASK_STATUSES.find((s) => s.value === status)!;
            const tasks = tasksByStatus[status];
            const cfg = STATUS_CFG[status];
            return (
              <div key={status} className={cn("flex w-[270px] sm:w-80 shrink-0 flex-col rounded-xl border-t-4 bg-muted/30", cfg.border)}>
                <div className="flex items-center justify-between p-3 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
                    <span className={cn("text-sm font-semibold", cfg.header)}>{statusDef.label}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", cfg.badge)}>{tasks.length}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-col gap-2 overflow-y-auto p-3 pt-0 min-h-[100px] max-h-[calc(100vh-360px)]">
                  {tasks.map((task) => {
                    const color = task.project ? projectColor(task.project.id) : "bg-gray-400";
                    const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "done";
                    return (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className="rounded-lg border bg-card p-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group"
                      >
                        {task.project && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className={cn("w-2 h-2 rounded-full shrink-0", color)} />
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{task.project.key}</span>
                          </div>
                        )}
                        <p className="text-sm font-medium leading-tight group-hover:text-primary transition-colors mb-2">{task.title}</p>
                        <div className="flex items-center justify-between">
                          <TaskPriorityBadge priority={task.priority} />
                          <div className="flex items-center gap-2">
                            {task.dueDate && (
                              <span className={cn("text-xs", isOverdue ? "text-red-500" : "text-muted-foreground")}>
                                <Calendar className="inline h-3 w-3 mr-0.5" />
                                {format(new Date(task.dueDate), "MMM d")}
                              </span>
                            )}
                            {task.assignee && <UserAvatar name={task.assignee.name} email={task.assignee.email} avatarUrl={task.assignee.avatarUrl} size="sm" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-3 pt-0">
                  <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add task
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTaskId && (
        <TaskDetail
          taskId={selectedTaskId}
          open={taskDetailOpen}
          workspaceId={workspaceId}
          onOpenChange={(open) => { setTaskDetailOpen(open); if (!open) setSelectedTaskId(null); }}
        />
      )}

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        workspaceId={workspaceId}
        projects={projects}
        onSubmit={async (projectId, data) => {
          const res = await fetch(`/api/projects/${projectId}/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error("Failed to create task");
          queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
        }}
        isSubmitting={false}
      />
    </div>
  );
}
