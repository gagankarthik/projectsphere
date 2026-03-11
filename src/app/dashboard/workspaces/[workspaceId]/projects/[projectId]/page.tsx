"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProjects } from "@/hooks/use-projects";
import { useTasks } from "@/hooks/use-tasks";
import { TaskDetail } from "@/components/task/task-detail";
import { CreateTaskDialog } from "@/components/task/create-task-dialog";
import { SpreadsheetView } from "@/components/views/spreadsheet-view";
import { KanbanBoard } from "@/components/views/kanban-board";
import { UserAvatar } from "@/components/shared/user-avatar";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutGrid,
  List,
  Kanban,
  Users,
  FileText,
  MessageSquare,
  Plus,
  Settings,
  CalendarDays,
  BarChart2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type Tab = "overview" | "tasks" | "discussions" | "members" | "files";

interface ProjectPageProps {
  params: Promise<{ workspaceId: string; projectId: string }>;
}

const PROJECT_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-orange-500",
  "bg-pink-500", "bg-teal-500", "bg-fuchsia-500", "bg-amber-500",
];
function projectColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PROJECT_COLORS[h % PROJECT_COLORS.length];
}

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-700",
  in_review: "bg-amber-100 text-amber-700",
  done: "bg-green-100 text-green-700",
};
const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

export default function ProjectPage({ params }: ProjectPageProps) {
  const { workspaceId, projectId } = use(params);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [taskView, setTaskView] = useState<"list" | "board">("list");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { projects, isLoading: projectsLoading } = useProjects(workspaceId);
  const project = projects.find((p) => p.id === projectId);

  const { tasks, isLoading: tasksLoading, reorderTask } = useTasks(projectId);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "tasks", label: "Tasks", icon: List },
    { id: "discussions", label: "Discussions", icon: MessageSquare },
    { id: "members", label: "Members", icon: Users },
    { id: "files", label: "Files", icon: FileText },
  ];

  const handleTaskClick = (task: import("@/types/task").Task) => {
    setSelectedTaskId(task.id);
    setTaskDetailOpen(true);
  };

  const statusGroups = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalTasks = tasks.length;
  const doneTasks = statusGroups["done"] || 0;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const colorClass = project ? projectColor(project.id) : "bg-blue-500";

  return (
    <div className="flex flex-col gap-0 -m-4 md:-m-5 min-h-full">
      {/* Project header */}
      <div className={cn("relative overflow-hidden")}>
        <div className="absolute inset-0 bg-[#645394] opacity-90" />
        <div className="relative px-5 md:px-8 pt-6 pb-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn("size-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg", colorClass)}>
                {project?.key?.[0] ?? "P"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {projectsLoading ? (
                    <div className="h-7 w-40 bg-white/20 rounded animate-pulse" />
                  ) : (
                    <h1 className="text-xl font-bold text-white">{project?.name ?? "Project"}</h1>
                  )}
                  <Badge className="text-[10px] font-mono bg-white/20 text-white border-white/30 hover:bg-white/30">
                    {project?.key}
                  </Badge>
                </div>
                {project?.description && (
                  <p className="text-sm text-white/70 mt-0.5 max-w-md">{project.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-8 bg-white/15 hover:bg-white/25 text-white border-white/20 border gap-1.5"
                variant="ghost"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="size-3.5" />
                <span className="hidden sm:inline">New Task</span>
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 bg-white/10 hover:bg-white/20 text-white" asChild>
                <Link href={`/dashboard/workspaces/${workspaceId}/projects/${projectId}/settings`}>
                  <Settings className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 mt-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all border-b-2",
                  activeTab === tab.id
                    ? "border-white text-white"
                    : "border-transparent text-white/60 hover:text-white/80"
                )}
              >
                <tab.icon className="size-3.5" />
                {tab.label}
                {tab.id === "tasks" && totalTasks > 0 && (
                  <span className="ml-1 text-[10px] bg-white/20 text-white rounded-full px-1.5 py-0.5">
                    {totalTasks}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 p-4 md:p-6 bg-slate-50/50">
        {/* Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Stats */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Progress</h3>
                <div className="flex items-end justify-between mb-2">
                  <span className="text-3xl font-bold text-blue-600">{progress}%</span>
                  <span className="text-xs text-slate-500">{doneTasks}/{totalTasks} tasks done</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Status Breakdown</h3>
                <div className="space-y-2">
                  {Object.entries(STATUS_LABELS).map(([status, label]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[status])}>{label}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{statusGroups[status] ?? 0}</span>
                    </div>
                  ))}
                </div>
              </div>

              {project && (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="size-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500">Created</span>
                      <span className="ml-auto text-xs font-medium">{format(new Date(project.createdAt), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent tasks */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">Recent Tasks</h3>
                  <button onClick={() => setActiveTab("tasks")} className="text-xs text-blue-600 hover:underline">
                    View all →
                  </button>
                </div>
                {tasksLoading ? (
                  <div className="space-y-2">
                    {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />)}
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">No tasks yet. <button className="text-blue-600 hover:underline" onClick={() => setCreateDialogOpen(true)}>Create one</button></div>
                ) : (
                  <div className="space-y-1">
                    {tasks.slice(0, 8).map((task, i) => (
                      <button
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 text-left transition-colors group"
                      >
                        <span className={cn("text-[10px] font-mono text-slate-400 w-14 shrink-0")}>{project?.key}-{String(i + 1).padStart(3, "0")}</span>
                        <span className="flex-1 text-sm text-slate-700 truncate">{task.title}</span>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full shrink-0", STATUS_COLORS[task.status])}>{STATUS_LABELS[task.status]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tasks */}
        {activeTab === "tasks" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
                <button
                  onClick={() => setTaskView("list")}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    taskView === "list" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100")}
                >
                  <List className="size-3.5" />
                  List
                </button>
                <button
                  onClick={() => setTaskView("board")}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    taskView === "board" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100")}
                >
                  <Kanban className="size-3.5" />
                  Board
                </button>
              </div>
              <Button size="sm" className="h-8" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="size-3.5 mr-1" /> New Task
              </Button>
            </div>
            {taskView === "list" ? (
              <SpreadsheetView tasks={tasks} onTaskClick={handleTaskClick} onAddTask={() => setCreateDialogOpen(true)} projectKey={project?.key} />
            ) : (
              <div className="h-[calc(100vh-280px)] overflow-auto">
                <KanbanBoard
                  tasksByStatus={tasks.reduce((acc, t) => {
                    acc[t.status] = [...(acc[t.status] ?? []), t];
                    return acc;
                  }, {} as Partial<Record<import("@/types/task").TaskStatus, import("@/types/task").Task[]>>)}
                  onTaskClick={handleTaskClick}
                  onAddTask={() => setCreateDialogOpen(true)}
                  onReorderTask={() => {}}
                />
              </div>
            )}
          </div>
        )}

        {/* Discussions placeholder */}
        {activeTab === "discussions" && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MessageSquare className="size-12 text-slate-300 mb-3" />
            <h3 className="text-sm font-semibold text-slate-600">Discussions coming soon</h3>
            <p className="text-xs text-slate-400 mt-1">Team discussions and comments will appear here.</p>
          </div>
        )}

        {/* Members */}
        {activeTab === "members" && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Team Members</h3>
            <p className="text-xs text-slate-400">Member management coming soon.</p>
          </div>
        )}

        {/* Files placeholder */}
        {activeTab === "files" && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="size-12 text-slate-300 mb-3" />
            <h3 className="text-sm font-semibold text-slate-600">Files coming soon</h3>
            <p className="text-xs text-slate-400 mt-1">Upload and share project files here.</p>
          </div>
        )}
      </div>

      {/* Task detail side sheet */}
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
        onSubmit={async (pid, data) => {
          const res = await fetch(`/api/projects/${pid}/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error("Failed to create task");
          queryClient.invalidateQueries({ queryKey: ["tasks", pid] });
        }}
        isSubmitting={false}
      />
    </div>
  );
}
