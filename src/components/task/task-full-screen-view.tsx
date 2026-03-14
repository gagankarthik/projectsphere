"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/shared/user-avatar";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FileUpload, AttachmentList } from "@/components/shared/file-upload";
import { MentionTextarea, RenderWithMentions } from "@/components/shared/mention-textarea";
import { useTask } from "@/hooks/use-tasks";
import { useWorkspaceMembers } from "@/hooks/use-workspaces";
import { updateTaskSchema, type UpdateTaskInput } from "@/validations/task";
import { TASK_STATUSES } from "@/constants/task-status";
import { TASK_PRIORITIES } from "@/constants/task-priority";
import { format } from "date-fns";
import {
  CalendarDays,
  Pencil,
  Trash2,
  ArrowLeft,
  Send,
  Paperclip,
  MessageSquare,
  FileText,
  Clock,
  User,
  Tag,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskFullScreenViewProps {
  taskId: string;
  workspaceId: string;
  projectId: string;
  projectKey?: string;
  onClose: () => void;
}

interface Comment {
  id: string;
  text: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  createdAt: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
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

export function TaskFullScreenView({
  taskId,
  workspaceId,
  projectId,
  projectKey,
  onClose,
}: TaskFullScreenViewProps) {
  const router = useRouter();
  const { task, isLoading, updateTaskAsync, isUpdating, deleteTaskAsync, isDeleting } =
    useTask(taskId);
  const { members } = useWorkspaceMembers(workspaceId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

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
          assigneeId: task.assigneeId,
        }
      : undefined,
  });

  const descriptionValue = watch("description") ?? "";

  // Fetch comments
  useEffect(() => {
    async function fetchComments() {
      if (!taskId) return;
      setIsLoadingComments(true);
      try {
        const res = await fetch(`/api/tasks/${taskId}/comments`);
        if (res.ok) {
          const data = await res.json();
          setComments(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch comments:", err);
      } finally {
        setIsLoadingComments(false);
      }
    }
    fetchComments();
  }, [taskId]);

  // Fetch attachments
  useEffect(() => {
    async function fetchAttachments() {
      if (!taskId) return;
      setIsLoadingFiles(true);
      try {
        const res = await fetch(`/api/tasks/${taskId}/files`);
        if (res.ok) {
          const data = await res.json();
          setAttachments(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch attachments:", err);
      } finally {
        setIsLoadingFiles(false);
      }
    }
    fetchAttachments();
  }, [taskId]);

  const taskNumber = projectKey && task?.order !== undefined
    ? `${projectKey}-${String(task.order + 1).padStart(3, "0")}`
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

  const handleAssigneeChange = async (assigneeId: string) => {
    try {
      await updateTaskAsync({ assigneeId: assigneeId === "unassigned" ? null : assigneeId });
      toast.success("Assignee updated");
    } catch {
      toast.error("Failed to update assignee");
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.data]);
        setCommentText("");
        toast.success("Comment added");
      } else {
        throw new Error("Failed to add comment");
      }
    } catch {
      toast.error("Failed to add comment");
    }
  };

  const handleFileUploadComplete = (file: UploadedFile) => {
    setAttachments((prev) => [...prev, file]);
  };

  const handleFileDelete = (fileId: string) => {
    setAttachments((prev) => prev.filter((f) => f.id !== fileId));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-muted-foreground">Task not found</p>
        <Button onClick={onClose} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-full bg-slate-50/50">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {taskNumber && (
                  <Badge variant="outline" className="text-xs font-mono text-indigo-600 border-indigo-200 bg-indigo-50 shrink-0">
                    {taskNumber}
                  </Badge>
                )}
                <h1 className="text-lg font-semibold text-slate-900 truncate">
                  {task.title}
                </h1>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <TooltipProvider delayDuration={0}>
                  {!isEditing && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                        >
                          <Pencil className="size-4 mr-1.5" />
                          Edit
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit task</TooltipContent>
                    </Tooltip>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete task</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left column - Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Task details card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileText className="size-4 text-slate-500" />
                    Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TASK_STATUSES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</Label>
                          <Select value={watch("priority")} onValueChange={(v) => setValue("priority", v as UpdateTaskInput["priority"], { shouldDirty: true })}>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TASK_PRIORITIES.map((p) => (
                                <SelectItem key={p.value} value={p.value}>{p.icon} {p.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Due Date</Label>
                        <Input type="date" {...register("dueDate")} className="h-9 text-sm" />
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
                    <div className="space-y-4">
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
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Files card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Paperclip className="size-4 text-slate-500" />
                    Attachments
                    {attachments.length > 0 && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {attachments.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FileUpload
                    entityType="task"
                    entityId={taskId}
                    onUploadComplete={handleFileUploadComplete}
                  />
                  {isLoadingFiles ? (
                    <div className="flex justify-center py-4">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : (
                    <AttachmentList
                      attachments={attachments}
                      onDelete={handleFileDelete}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Comments card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <MessageSquare className="size-4 text-slate-500" />
                    Comments
                    {comments.length > 0 && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {comments.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Comment input */}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Write a comment... Use @ to mention teammates"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                      className="text-sm min-h-[80px] resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button size="sm" onClick={handleAddComment} disabled={!commentText.trim()}>
                        <Send className="size-3.5 mr-1.5" />
                        Comment
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Comments list */}
                  {isLoadingComments ? (
                    <div className="flex justify-center py-4">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : comments.length > 0 ? (
                    <div className="space-y-4">
                      {comments.map((c) => (
                        <div key={c.id} className="flex gap-3">
                          <UserAvatar
                            name={c.author.name}
                            email={c.author.email}
                            avatarUrl={c.author.avatarUrl}
                            size="sm"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-slate-700">{c.author.name}</span>
                              <span className="text-xs text-slate-400">{format(new Date(c.createdAt), "MMM d, h:mm a")}</span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{c.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="size-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">No comments yet</p>
                      <p className="text-xs text-slate-300 mt-1">Be the first to comment on this task</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right column - Sidebar */}
            <div className="space-y-4">
              {/* Status */}
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {/* Status */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Status</p>
                      <Select value={task.status} onValueChange={handleQuickStatusChange}>
                        <SelectTrigger className={cn("h-9 text-sm border rounded-lg", STATUS_COLORS[task.status])}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Priority */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Priority</p>
                      <Select value={task.priority} onValueChange={handleQuickPriorityChange}>
                        <SelectTrigger className={cn("h-9 text-sm border rounded-lg", PRIORITY_COLORS[task.priority])}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_PRIORITIES.map((p) => (
                            <SelectItem key={p.value} value={p.value}>{p.icon} {p.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Assignee */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                        <User className="size-3" />
                        Assignee
                      </p>
                      <Select value={task.assigneeId || "unassigned"} onValueChange={handleAssigneeChange}>
                        <SelectTrigger className="h-9 text-sm">
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

                    {/* Due Date */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                        <CalendarDays className="size-3" />
                        Due Date
                      </p>
                      {task.dueDate ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <CalendarDays className="size-3.5 text-blue-500" />
                          <span className="font-medium text-slate-700">{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">No due date</p>
                      )}
                    </div>

                    {/* Reporter */}
                    {task.reporter && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Reporter</p>
                        <div className="flex items-center gap-2">
                          <UserAvatar name={task.reporter.name} email={task.reporter.email} avatarUrl={task.reporter.avatarUrl} size="sm" />
                          <span className="text-sm font-medium text-slate-700">{task.reporter.name || task.reporter.email}</span>
                        </div>
                      </div>
                    )}

                    {/* Created */}
                    {task.createdAt && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                          <Clock className="size-3" />
                          Created
                        </p>
                        <p className="text-sm text-slate-600">{format(new Date(task.createdAt), "MMM d, yyyy")}</p>
                      </div>
                    )}

                    {/* Labels */}
                    {task.labels && task.labels.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                          <Tag className="size-3" />
                          Labels
                        </p>
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
                </CardContent>
              </Card>
            </div>
          </div>
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
