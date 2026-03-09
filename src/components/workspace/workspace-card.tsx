"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Users } from "lucide-react";
import type { WorkspaceWithRole } from "@/types/workspace";

interface WorkspaceCardProps {
  workspace: WorkspaceWithRole;
  onClick?: () => void;
}

export function WorkspaceCard({ workspace, onClick }: WorkspaceCardProps) {
  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            {workspace.name}
          </CardTitle>
          <Badge variant="secondary">{workspace.role}</Badge>
        </div>
        <CardDescription>{workspace.description || "No description"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="text-xs">/{workspace.slug}</span>
        </div>
      </CardContent>
    </Card>
  );
}
