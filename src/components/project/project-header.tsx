"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { LayoutDashboard, CheckSquare, MessageSquare, GanttChart, CalendarDays, Settings, ChevronRight } from "lucide-react";
import type { Project } from "@/types/project";

interface ProjectHeaderProps {
  project: Project;
  workspaceId: string;
  currentView: "overview" | "tasks" | "comments" | "timeline" | "calendar" | "settings";
}

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "comments", label: "Comments", icon: MessageSquare },
  { id: "timeline", label: "Timeline", icon: GanttChart },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

export function ProjectHeader({ project, workspaceId, currentView }: ProjectHeaderProps) {
  return (
    <div className="flex flex-col gap-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-3">
        <Link href={`/dashboard/workspaces/${workspaceId}/projects`} className="hover:text-slate-700">
          Projects
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-slate-800">{project.name}</span>
      </div>

      {/* View tabs */}
      <div className="flex items-center gap-0 border-b border-slate-200 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = currentView === tab.id;
          const href = `/dashboard/workspaces/${workspaceId}/projects/${project.id}/${tab.id}`;
          return (
            <Link
              key={tab.id}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
