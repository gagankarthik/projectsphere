"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/shared/user-avatar";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MentionTextarea, RenderWithMentions } from "@/components/shared/mention-textarea";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskPriorityBadge } from "./task-priority-badge";
import { useTask } from "@/hooks/use-tasks";
import { updateTaskSchema, type UpdateTaskInput } from "@/validations/task";
import { TASK_STATUSES } from "@/constants/task-status";
import { TASK_PRIORITIES } from "@/constants/task-priority";
import { format } from "date-fns";
import {
  CalendarDays,
  Pencil,
  Trash2,
  User,
  Flag,
  Tag,
  X,
  Maximize2,
  Minimize2,
  Send,
  Paperclip,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskDetailProps {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  projectKey?: string;
  taskIndex?: number;
}

interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: Date;
}

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-slate-100 text-slate-700 border-slate-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  in_review: "bg-amber-100 text-amber-700 border-amber-200",
  done: "bg-green-100 text-green-700 border-green-200",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-600 border-slate-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  urgent: "bg-red-100 text-red-700 border-red-200",
};

function TaskDetailContent({
  taskId,
  workspaceId,
  onClose,
  projectKey,
  taskIndex,
}: {
  taskId: string;
  workspaceId: string;
  onClose: () => void;
  projectKey?: string;
  taskIndex?: number;
}) {
  const { task, isLoading, updateTaskAsync, isUpdating, deleteTaskAsync, isDeleting } =
    useTask(taskId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm<UpdateTaskInput>({
    resolver: zodResolver(updateTaskSchema),
    values: task
      ? {
          title: task.title,
          description: task.description ?? "",
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
        }
      : undefined,
  });

  const descriptionValue = watch("description") ?? "";

  const taskNumber = projectKey && taskIndex !== undefined
    ? `${projectKey}-${String(taskIndex + 1).padStart(3, "0")}`
    : null;

  const onSubmit = async (data: UpdateTaskInput) => {
    try {
      await updateTaskAsync(data);
      toast.success("Task updated");
      setIsEditing(false);
    } catch {
      toast.error("Failed to update task");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTaskAsync();
      toast.success("Task deleted");
      onClose();
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const handleQuickStatusChange = async (newStatus: string) => {
    try {
      await updateTaskAsync({ status: newStatus as UpdateTaskInput["status"] });
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleQuickPriorityChange = async (newPriority: string) => {
    try {
      await updateTaskAsync({ priority: newPriority as UpdateTaskInput["priority"] });
      toast.success("Priority updated");
    } catch {
      toast.error("Failed to update priority");
    }
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    setComments((prev) => [
      ...prev,
      { id: Date.now().toString(), text: commentText.trim(), author: "You", createdAt: new Date() },
    ]);
    setCommentText("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1 py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center flex-1 py-20">
        <p className="text-sm text-muted-foreground">Task not found</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b bg-white shrink-0">
          <div className="flex items-center gap-2">
            {taskNumber && (
              <Badge variant="outline" className="text-[10px] font-mono text-blue-600 border-blue-200 bg-blue-50">
                {taskNumber}
              </Badge>
            )}
            <Badge variant="outline" className={cn("text-[10px]", STATUS_COLORS[task.status])}>
              {TASK_STATUSES.find(s => s.value === task.status)?.label ?? task.status}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {!isEditing && (
              <Button variant="ghost" size="icon" className="size-7" onClick={() => setIsEditing(true)} title="Edit">
                <Pencil className="size-3.5" />
              </Button>
            )}
            <Button
              variant="ghost" size="icon"
              className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteDialogOpen(true)} title="Delete"
            >
              <Trash2 className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
              <X className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Title</Label>
                <Input {...register("title")} aria-invalid={!!errors.title} className="text-sm font-medium" />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Description <span className="font-normal normal-case text-muted-foreground">— @ to mention</span>
                </Label>
                <MentionTextarea
                  value={descriptionValue}
                  onChange={(v) => setValue("description", v, { shouldDirty: true })}
                  workspaceId={workspaceId}
                  rows={4}
                  placeholder="Add details… @ to mention a teammate"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</Label>
                  <Select value={watch("status")} onValueChange={(v) => setValue("status", v as UpdateTaskInput["status"], { shouldDirty: true })}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value} className="text-sm">{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</Label>
                  <Select value={watch("priority")} onValueChange={(v) => setValue("priority", v as UpdateTaskInput["priority"], { shouldDirty: true })}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value} className="text-sm">{p.icon} {p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Due Date</Label>
                <Input type="date" {...register("dueDate")} className="h-8 text-sm" />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" size="sm" disabled={isUpdating || !isDirty}>
                  {isUpdating && <LoadingSpinner size="sm" className="mr-1.5" />}
                  Save changes
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => { reset(); setIsEditing(false); }}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="p-4 space-y-5">
              {/* Title */}
              <h2 className="text-lg font-semibold leading-snug text-slate-800">{task.title}</h2>

              {/* Quick property pills */}
              <div className="flex flex-wrap gap-2">
                <Select value={task.status} onValueChange={handleQuickStatusChange}>
                  <SelectTrigger className={cn("w-fit h-7 text-xs gap-1.5 border rounded-full px-2.5", STATUS_COLORS[task.status])}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-sm">{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={task.priority} onValueChange={handleQuickPriorityChange}>
                  <SelectTrigger className={cn("w-fit h-7 text-xs gap-1.5 border rounded-full px-2.5", PRIORITY_COLORS[task.priority])}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value} className="text-sm">{p.icon} {p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Description</p>
                <div className="text-sm text-slate-600 leading-relaxed min-h-[36px]">
                  {task.description ? (
                    <RenderWithMentions text={task.description} />
                  ) : (
                    <span className="italic text-slate-300">No description</span>
                  )}
                </div>
              </div>

              <Separator />

              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Assignee</p>
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <UserAvatar name={task.assignee.name} email={task.assignee.email} avatarUrl={task.assignee.avatarUrl} size="sm" />
                      <span className="text-sm font-medium truncate text-slate-700">{task.assignee.name || task.assignee.email}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">Unassigned</p>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Reporter</p>
                  {task.reporter ? (
                    <div className="flex items-center gap-2">
                      <UserAvatar name={task.reporter.name} email={task.reporter.email} avatarUrl={task.reporter.avatarUrl} size="sm" />
                      <span className="text-sm font-medium truncate text-slate-700">{task.reporter.name || task.reporter.email}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">—</p>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Due Date</p>
                  {task.dueDate ? (
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="size-3.5 text-blue-500" />
                      <p className="text-sm font-medium text-slate-700">{format(new Date(task.dueDate), "MMM d, yyyy")}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No due date</p>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Priority</p>
                  <span className={cn("inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium border", PRIORITY_COLORS[task.priority])}>
                    {TASK_PRIORITIES.find(p => p.value === task.priority)?.icon}{" "}
                    {TASK_PRIORITIES.find(p => p.value === task.priority)?.label}
                  </span>
                </div>

                {task.createdAt && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Created</p>
                    <p className="text-sm text-slate-600">{format(new Date(task.createdAt), "MMM d, yyyy")}</p>
                  </div>
                )}

                {task.labels && task.labels.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Labels</p>
                    <div className="flex flex-wrap gap-1.5">
                      {task.labels.map((label) => (
                        <span key={label} className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 text-xs font-medium">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Files section */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Files</p>
                <div className="flex items-center gap-2 p-3 border border-dashed border-slate-200 rounded-lg">
                  <Paperclip className="size-4 text-slate-300" />
                  <p className="text-xs text-slate-400">File upload coming soon</p>
                </div>
              </div>

              <Separator />

              {/* Comments */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <MessageSquare className="size-3.5 text-slate-400" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Comments {comments.length > 0 && `(${comments.length})`}
                  </p>
                </div>
                <div className="space-y-3 mb-3">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-2">
                      <div className="size-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[10px] font-bold shrink-0">
                        {c.author[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-slate-700">{c.author}</span>
                          <span className="text-[10px] text-slate-400">{format(c.createdAt, "MMM d, h:mm a")}</span>
                        </div>
                        <p className="text-sm text-slate-600">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                    className="text-sm min-h-[60px] resize-none"
                    rows={2}
                  />
                  <Button size="icon" className="h-9 w-9 shrink-0 self-end" onClick={handleAddComment} disabled={!commentText.trim()}>
                    <Send className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete task?"
        description="This action cannot be undone. The task will be permanently deleted."
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  );
}

export function TaskDetail({ taskId, open, onOpenChange, workspaceId, projectKey, taskIndex }: TaskDetailProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handleClose = () => onOpenChange(false);

  if (isFullScreen) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl w-full h-[90vh] p-0 flex flex-col overflow-hidden">
          <DialogTitle className="sr-only">Task Details</DialogTitle>
          <div className="flex items-center justify-between px-4 py-2 border-b bg-slate-50 shrink-0">
            <span className="text-xs text-muted-foreground">Full screen view</span>
            <Button variant="ghost" size="icon" className="size-7" onClick={() => setIsFullScreen(false)} title="Exit full screen">
              <Minimize2 className="size-3.5" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <TaskDetailContent
              taskId={taskId}
              workspaceId={workspaceId}
              onClose={handleClose}
              projectKey={projectKey}
              taskIndex={taskIndex}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0 overflow-hidden">
        <SheetHeader className="sr-only">
          <SheetTitle>Task Details</SheetTitle>
        </SheetHeader>
        <div className="flex items-center justify-end px-4 py-1.5 border-b bg-slate-50 shrink-0">
          <Button variant="ghost" size="icon" className="size-7" onClick={() => setIsFullScreen(true)} title="Full screen">
            <Maximize2 className="size-3.5" />
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <TaskDetailContent
            taskId={taskId}
            workspaceId={workspaceId}
            onClose={handleClose}
            projectKey={projectKey}
            taskIndex={taskIndex}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
