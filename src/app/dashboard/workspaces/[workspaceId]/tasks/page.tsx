"use client";

import { use, useState, useMemo } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProjects } from "@/hooks/use-projects";
import { TaskDetail } from "@/components/task/task-detail";
import { CreateTaskSheet } from "@/components/task/create-task-sheet";
import { SpreadsheetView } from "@/components/views/spreadsheet-view";
import { ListView } from "@/components/views/list-view";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TASK_STATUSES } from "@/constants/task-status";
import { TASK_PRIORITIES } from "@/constants/task-priority";
import { CheckSquare, Plus, Search, Filter, FolderKanban, X, List, LayoutGrid, Calendar, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isPast, isThisWeek } from "date-fns";
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

interface WorkspaceTasksPageProps {
  params: Promise<{ workspaceId: string }>;
}

type ViewMode = "list" | "spreadsheet";
type DateFilter = "all" | "today" | "week" | "overdue";

export default function WorkspaceTasksPage({ params }: WorkspaceTasksPageProps) {
  const { workspaceId } = use(params);
  const router = useRouter();
  const { projects, isLoading: projectsLoading } = useProjects(workspaceId);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<DateFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("spreadsheet");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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
      if (selectedPriority !== "all" && t.priority !== selectedPriority) return false;

      // Date filter
      if (selectedDate !== "all" && t.dueDate) {
        const dueDate = new Date(t.dueDate);
        if (selectedDate === "today" && !isToday(dueDate)) return false;
        if (selectedDate === "week" && !isThisWeek(dueDate)) return false;
        if (selectedDate === "overdue" && !isPast(dueDate)) return false;
      } else if (selectedDate !== "all" && !t.dueDate) {
        return false;
      }

      if (search) {
        const s = search.toLowerCase();
        if (!t.title.toLowerCase().includes(s) && !t.description?.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [allTasks, selectedProject, selectedStatus, selectedPriority, selectedDate, search]);

  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
    setTaskDetailOpen(true);
  };

  const handleOpenFullScreen = (task: TaskWithProject) => {
    router.push(`/dashboard/workspaces/${workspaceId}/projects/${task.projectId}/task/${task.id}`);
  };

  const handleCreateTask = async (projectId: string, data: any) => {
    setIsCreating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create task");
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    } finally {
      setIsCreating(false);
    }
  };

  const isLoading = projectsLoading || isTasksLoading;
  const activeFiltersCount = [
    selectedProject !== "all",
    selectedStatus !== "all",
    selectedPriority !== "all",
    selectedDate !== "all",
  ].filter(Boolean).length;
  const hasFilters = !!(search || activeFiltersCount > 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Page title row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-blue-600" />
            All Tasks
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""} across {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        {projects.length > 0 && (
          <Button size="sm" className="h-8 self-start" onClick={() => setCreateSheetOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Task
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-40 sm:w-48 pl-8 h-8 text-sm bg-white border-slate-200"
            />
          </div>

          {/* Project filter */}
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-32 sm:w-36 h-8 text-sm bg-white border-slate-200">
              <SelectValue placeholder="Project" />
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

          {/* Status filter */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-28 sm:w-32 h-8 text-sm bg-white border-slate-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {TASK_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* More filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 border-slate-200 text-slate-600 bg-white">
                <Filter className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">More</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Priority</label>
                  <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="All Priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      {TASK_PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.icon} {p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Due Date</label>
                  <Select value={selectedDate} onValueChange={(v) => setSelectedDate(v as DateFilter)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="All Dates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="today">Due Today</SelectItem>
                      <SelectItem value="week">Due This Week</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Clear filters */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-slate-400 hover:text-slate-600"
              onClick={() => {
                setSearch("");
                setSelectedProject("all");
                setSelectedStatus("all");
                setSelectedPriority("all");
                setSelectedDate("all");
              }}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* View switcher */}
        <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2.5"
            onClick={() => setViewMode("list")}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={viewMode === "spreadsheet" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2.5"
            onClick={() => setViewMode("spreadsheet")}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-1 rounded-xl border border-slate-200 overflow-hidden bg-white">
          <div className="h-10 bg-slate-50 border-b border-slate-100" />
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-none" />
          ))}
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
            hasFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setSelectedProject("all");
                  setSelectedStatus("all");
                  setSelectedPriority("all");
                  setSelectedDate("all");
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button onClick={() => setCreateSheetOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create Task
              </Button>
            )
          }
        />
      ) : viewMode === "spreadsheet" ? (
        <SpreadsheetView
          tasks={filteredTasks}
          onTaskClick={handleTaskClick}
          onAddTask={() => setCreateSheetOpen(true)}
        />
      ) : (
        <ListView
          tasks={filteredTasks}
          onTaskClick={handleTaskClick}
          onAddTask={() => setCreateSheetOpen(true)}
        />
      )}

      {selectedTaskId && (
        <TaskDetail
          taskId={selectedTaskId}
          open={taskDetailOpen}
          workspaceId={workspaceId}
          onOpenChange={(open) => { setTaskDetailOpen(open); if (!open) setSelectedTaskId(null); }}
        />
      )}

      <CreateTaskSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        workspaceId={workspaceId}
        projects={projects}
        onSubmit={handleCreateTask}
        isSubmitting={isCreating}
      />
    </div>
  );
}
