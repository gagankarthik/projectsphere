"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useProject } from "@/hooks/use-projects";
import { updateProjectSchema, type UpdateProjectInput } from "@/validations/project";
import { toast } from "sonner";

interface ProjectSettingsPageProps {
  params: Promise<{ workspaceId: string; projectId: string }>;
}

export default function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  const { workspaceId, projectId } = use(params);
  const router = useRouter();
  const {
    project,
    isLoading,
    updateProjectAsync,
    isUpdating,
    deleteProjectAsync,
    isDeleting,
  } = useProject(projectId);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProjectInput>({
    resolver: zodResolver(updateProjectSchema),
    values: project
      ? { name: project.name, description: project.description }
      : undefined,
  });

  const onSubmit = async (data: UpdateProjectInput) => {
    try {
      setError(null);
      await updateProjectAsync(data);
      toast.success("Project updated");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update project");
      }
    }
  };

  const handleArchive = async () => {
    try {
      await updateProjectAsync({
        status: project?.status === "active" ? "archived" : "active",
      });
      toast.success(
        project?.status === "active" ? "Project archived" : "Project restored"
      );
      setArchiveDialogOpen(false);
    } catch (err) {
      toast.error("Failed to update project status");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProjectAsync();
      toast.success("Project deleted");
      router.push(`/workspaces/${workspaceId}/projects`);
    } catch (err) {
      toast.error("Failed to delete project");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Project Settings</h1>
        <p className="text-muted-foreground">Manage project settings for {project.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Update project information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="key">Project Key</Label>
              <Input id="key" value={project.key} disabled />
              <p className="text-xs text-muted-foreground">
                Project keys cannot be changed after creation
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                {...register("description")}
                aria-invalid={!!errors.description}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={isUpdating || !isDirty}>
              {isUpdating ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Status</CardTitle>
          <CardDescription>
            {project.status === "active"
              ? "Archive this project to hide it from the main view"
              : "Restore this project to make it active again"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant={project.status === "active" ? "secondary" : "default"}
            onClick={() => setArchiveDialogOpen(true)}
          >
            {project.status === "active" ? "Archive Project" : "Restore Project"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete this project and all its tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            Delete Project
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        title={project.status === "active" ? "Archive project?" : "Restore project?"}
        description={
          project.status === "active"
            ? "Archived projects will be hidden from the main project list but can be restored later."
            : "This project will be restored and visible in the main project list."
        }
        confirmText={project.status === "active" ? "Archive" : "Restore"}
        onConfirm={handleArchive}
        isLoading={isUpdating}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete project?"
        description="This action cannot be undone. All tasks and data will be permanently deleted."
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
