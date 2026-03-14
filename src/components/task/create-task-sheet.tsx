"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { MentionTextarea } from "@/components/shared/mention-textarea";
import { UserAvatar } from "@/components/shared/user-avatar";
import { createTaskSchema, type CreateTaskInput } from "@/validations/task";
import { TASK_STATUSES } from "@/constants/task-status";
import { TASK_PRIORITIES } from "@/constants/task-priority";
import { useWorkspaceMembers } from "@/hooks/use-workspaces";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types/task";
import type { Project } from "@/types/project";
import { CalendarDays, User } from "lucide-react";

const PROJECT_COLORS = [
  "bg-violet-500","bg-blue-500","bg-emerald-500","bg-orange-500",
  "bg-pink-500","bg-teal-500","bg-fuchsia-500","bg-amber-500",
];
function projectColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PROJECT_COLORS[h % PROJECT_COLORS.length];
}

interface CreateTaskSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (projectId: string, data: CreateTaskInput) => Promise<void>;
  isSubmitting?: boolean;
  defaultStatus?: TaskStatus;
  defaultDueDate?: string;
  workspaceId: string;
  projectId?: string;
  projects?: Project[];
  defaultProjectId?: string;
}

export function CreateTaskSheet({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  defaultStatus,
  defaultDueDate,
  workspaceId,
  projectId,
  projects,
  defaultProjectId,
}: CreateTaskSheetProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    defaultProjectId ?? projectId ?? ""
  );

  const { members } = useWorkspaceMembers(workspaceId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      status: defaultStatus || "todo",
      priority: "medium",
      labels: [],
      description: "",
      dueDate: defaultDueDate || "",
    },
  });

  const status = watch("status");
  const priority = watch("priority");
  const description = watch("description") ?? "";
  const assigneeId = watch("assigneeId");

  const selectedProject = projects?.find((p) => p.id === selectedProjectId);
  const showPicker = !projectId && !!projects && projects.length > 0;

  const handleOpenChange = (o: boolean) => {
    if (o) {
      setSelectedProjectId(defaultProjectId ?? projectId ?? "");
      reset({
        status: defaultStatus || "todo",
        priority: "medium",
        labels: [],
        description: "",
        dueDate: defaultDueDate || "",
      });
    }
    onOpenChange(o);
  };

  const handleFormSubmit = async (data: CreateTaskInput) => {
    const pid = projectId ?? selectedProjectId;
    if (!pid) return;
    await onSubmit(pid, data);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col overflow-hidden" showCloseButton={false}>
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <SheetTitle className="text-lg font-semibold">Create New Task</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {showPicker
              ? "Choose a project and fill in the task details."
              : "Add a task with all the details. Use @ to mention teammates."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {/* Project selector */}
            {showPicker && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Project <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedProjectId ?? ""}
                  onValueChange={(v) => setSelectedProjectId(v)}
                >
                  <SelectTrigger className={cn("text-sm h-10", !selectedProjectId && "text-muted-foreground")}>
                    <SelectValue placeholder="Select a project…">
                      {selectedProject && (
                        <span className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full shrink-0", projectColor(selectedProject.id))} />
                          <span className="font-mono text-xs text-muted-foreground">{selectedProject.key}</span>
                          <span>{selectedProject.name}</span>
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full shrink-0", projectColor(p.id))} />
                          <span className="font-mono text-xs text-muted-foreground">{p.key}</span>
                          <span>{p.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="What needs to be done?"
                {...register("title")}
                aria-invalid={!!errors.title}
                className="text-sm h-10"
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-medium">
                Description{" "}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  — use @ to mention
                </span>
              </Label>
              <MentionTextarea
                id="description"
                value={description}
                onChange={(v) => setValue("description", v)}
                workspaceId={workspaceId}
                rows={3}
                placeholder="Add details… @ to mention a teammate"
              />
            </div>

            {/* Status + Priority */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setValue("status", v as CreateTaskInput["status"])}
                >
                  <SelectTrigger className="text-sm h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setValue("priority", v as CreateTaskInput["priority"])}
                >
                  <SelectTrigger className="text-sm h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.icon} {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <User className="size-3.5" />
                Assignee
              </Label>
              <Select
                value={assigneeId || "unassigned"}
                onValueChange={(v) => setValue("assigneeId", v === "unassigned" ? undefined : v)}
              >
                <SelectTrigger className="text-sm h-10">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      <span className="flex items-center gap-2">
                        <UserAvatar name={m.user?.name || ""} email={m.user?.email || ""} size="xs" />
                        {m.user?.name || m.user?.email}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="startDate" className="text-sm font-medium flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  className="text-sm h-10"
                  onChange={(e) => {
                    // Store in description or handle separately
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dueDate" className="text-sm font-medium flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  Due Date
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...register("dueDate")}
                  className="text-sm h-10"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t px-6 py-4 bg-slate-50/50">
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || (showPicker && !selectedProjectId)}
              >
                {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
                Create Task
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
