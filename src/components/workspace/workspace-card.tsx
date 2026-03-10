"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import type { WorkspaceWithRole } from "@/types/workspace";

const GRADIENT_PAIRS = [
  { from: "from-violet-500", to: "to-purple-600"  },
  { from: "from-blue-500",   to: "to-indigo-600"  },
  { from: "from-emerald-500",to: "to-teal-600"    },
  { from: "from-orange-500", to: "to-amber-600"   },
  { from: "from-pink-500",   to: "to-rose-600"    },
  { from: "from-cyan-500",   to: "to-sky-600"     },
];

const ROLE_STYLES: Record<string, string> = {
  owner:  "bg-violet-100 text-violet-700 border-violet-200",
  admin:  "bg-blue-100 text-blue-700 border-blue-200",
  member: "bg-slate-100 text-slate-600 border-slate-200",
  viewer: "bg-slate-100 text-slate-500 border-slate-200",
};

function getGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENT_PAIRS[hash % GRADIENT_PAIRS.length];
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

interface WorkspaceCardProps {
  workspace: WorkspaceWithRole;
  onClick?: () => void;
}

export function WorkspaceCard({ workspace, onClick }: WorkspaceCardProps) {
  const g = getGradient(workspace.id);

  return (
    <Card
      className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 overflow-hidden border-0 shadow-md"
      onClick={onClick}
    >
      <div className={`h-2 w-full bg-gradient-to-r ${g.from} ${g.to}`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${g.from} ${g.to} text-white text-sm font-bold shadow-sm`}>
            {getInitials(workspace.name)}
          </div>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${ROLE_STYLES[workspace.role] ?? ROLE_STYLES.member}`}>
            {workspace.role}
          </span>
        </div>
        <div className="space-y-1 mb-4">
          <h3 className="text-base font-bold leading-tight group-hover:text-primary transition-colors">
            {workspace.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {workspace.description || "No description provided"}
          </p>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono bg-muted rounded px-1.5 py-0.5">/{workspace.slug}</span>
          <span className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">
            Open <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
