"use client";

import { use } from "react";
import { redirect } from "next/navigation";

interface ProjectPageProps {
  params: Promise<{ workspaceId: string; projectId: string }>;
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { workspaceId, projectId } = use(params);

  // Redirect to overview by default
  redirect(`/dashboard/workspaces/${workspaceId}/projects/${projectId}/overview`);
}
