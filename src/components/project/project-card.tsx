"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckSquare, ArrowRight } from "lucide-react";
import type { Project } from "@/types/project";

const GRADIENT_PAIRS = [
  { from: "from-violet-500", to: "to-purple-600",  dot: "bg-violet-500"  },
  { from: "from-blue-500",   to: "to-indigo-600",  dot: "bg-blue-500"    },
  { from: "from-emerald-500",to: "to-teal-600",    dot: "bg-emerald-500" },
  { from: "from-orange-500", to: "to-amber-600",   dot: "bg-orange-500"  },
  { from: "from-pink-500",   to: "to-rose-600",    dot: "bg-pink-500"    },
  { from: "from-cyan-500",   to: "to-sky-600",     dot: "bg-cyan-500"    },
];

const STATUS_STYLES: Record<string, string> = {
  active:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  archived: "bg-slate-100 text-slate-500 border-slate-200",
};

function getGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENT_PAIRS[hash % GRADIENT_PAIRS.length];
}

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const g = getGradient(project.id);

  return (
    <Card
      className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 overflow-hidden border-0 shadow-md"
      onClick={onClick}
    >
      <div className={`h-2 w-full bg-gradient-to-r ${g.from} ${g.to}`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`size-2.5 shrink-0 rounded-full ${g.dot}`} />
            <h3 className="text-base font-bold leading-tight group-hover:text-primary transition-colors truncate">
              {project.name}
            </h3>
          </div>
          <span className={`inline-flex items-center shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[project.status] ?? STATUS_STYLES.active}`}>
            {project.status}
          </span>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[40px]">
          {project.description || "No description provided"}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="font-mono bg-muted rounded px-1.5 py-0.5">{project.key}</span>
            <span className="flex items-center gap-1">
              <CheckSquare className="h-3.5 w-3.5" />
              {project.taskCount ?? 0} tasks
            </span>
          </div>
          <span className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">
            Board <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
