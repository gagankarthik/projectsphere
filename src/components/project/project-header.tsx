"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings, TableProperties, Kanban, ChevronRight, CalendarDays, GanttChart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

interface ProjectHeaderProps {
  project: Project;
  workspaceId: string;
  currentView: "board" | "list" | "timeline" | "calendar";
}

const TABS = [
  { id: "board", label: "Board", icon: Kanban },
  { id: "list", label: "Spreadsheet", icon: TableProperties },
  { id: "timeline", label: "Timeline", icon: GanttChart },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
] as const;

export function ProjectHeader({ project, workspaceId, currentView }: ProjectHeaderProps) {
  return (
    <div className="flex flex-col gap-0">
      {/* Breadcrumb + settings row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <Link href={`/dashboard/workspaces/${workspaceId}/projects`} className="hover:text-slate-700">
            Projects
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-slate-800">{project.name}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-slate-500 hover:text-slate-700"
          asChild
        >
          <Link href={`/dashboard/workspaces/${workspaceId}/projects/${project.id}/settings`}>
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">Settings</span>
          </Link>
        </Button>
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
