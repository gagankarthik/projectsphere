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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/shared/user-avatar";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MentionTextarea, RenderWithMentions } from "@/components/shared/mention-textarea";
import { useTask } from "@/hooks/use-tasks";
import { updateTaskSchema, type UpdateTaskInput } from "@/validations/task";
import { TASK_STATUSES } from "@/constants/task-status";
import { TASK_PRIORITIES } from "@/constants/task-priority";
import { format } from "date-fns";
import {
  CalendarDays,
  Pencil,
  Trash2,
  X,
  Maximize2,
  Minimize2,
  Send,
  Paperclip,
  MessageSquare,
  FileText,
  Image as ImageIcon,
  File,
  Upload,
  Plus,
  MoreHorizontal,
  ExternalLink,
  Copy,
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

interface FileItem {
  id: string;
  name: string;
  type: "image" | "document" | "other";
  size: string;
  uploadedAt: Date;
  uploadedBy: string;
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

type TabType = "details" | "files" | "comments";

function TaskDetailContent({
  taskId,
  workspaceId,
  onClose,
  projectKey,
  taskIndex,
  isFullScreen,
  onToggleFullScreen,
}: {
  taskId: string;
  workspaceId: string;
  onClose: () => void;
  projectKey?: string;
  taskIndex?: number;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
}) {
  const { task, isLoading, updateTaskAsync, isUpdating, deleteTaskAsync, isDeleting } =
    useTask(taskId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);

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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
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

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "details", label: "Details", icon: <FileText className="size-3.5" /> },
    { id: "files", label: "Files", icon: <Paperclip className="size-3.5" />, count: files.length },
    { id: "comments", label: "Comments", icon: <MessageSquare className="size-3.5" />, count: comments.length },
  ];

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="border-b bg-white shrink-0">
          {/* Top actions bar */}
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2">
              {taskNumber && (
                <Badge variant="outline" className="text-[10px] font-mono text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 cursor-pointer transition-colors">
                  {taskNumber}
                </Badge>
              )}
              <Badge variant="outline" className={cn("text-[10px]", STATUS_COLORS[task.status])}>
                {TASK_STATUSES.find(s => s.value === task.status)?.label ?? task.status}
              </Badge>
            </div>

            <div className="flex items-center gap-0.5">
              <TooltipProvider delayDuration={0}>
                {!isEditing && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                        onClick={() => setIsEditing(true)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">Edit task</TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                      onClick={handleCopyLink}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Copy link</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                      onClick={onToggleFullScreen}
                    >
                      {isFullScreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {isFullScreen ? "Exit full screen" : "Full screen"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Delete task</TooltipContent>
                </Tooltip>

                <div className="w-px h-5 bg-slate-200 mx-1" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                      onClick={onClose}
                    >
                      <X className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Close</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "text-indigo-600 border-indigo-600 bg-indigo-50/50"
                    : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={cn(
                    "ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full",
                    activeTab === tab.id
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-slate-100 text-slate-600"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Details Tab */}
          {activeTab === "details" && (
            <>
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
                </div>
              )}
            </>
          )}

          {/* Files Tab */}
          {activeTab === "files" && (
            <div className="p-4 space-y-4">
              {/* Upload area */}
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors cursor-pointer group">
                <div className="flex flex-col items-center gap-2">
                  <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <Upload className="size-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Drop files here or click to upload</p>
                    <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, PDF, DOC up to 10MB</p>
                  </div>
                </div>
              </div>

              {/* Files list */}
              {files.length > 0 ? (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                      <div className={cn(
                        "size-10 rounded-lg flex items-center justify-center",
                        file.type === "image" ? "bg-pink-100" :
                        file.type === "document" ? "bg-blue-100" : "bg-slate-100"
                      )}>
                        {file.type === "image" ? (
                          <ImageIcon className="size-5 text-pink-600" />
                        ) : file.type === "document" ? (
                          <FileText className="size-5 text-blue-600" />
                        ) : (
                          <File className="size-5 text-slate-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                        <p className="text-xs text-slate-400">{file.size} • Uploaded by {file.uploadedBy}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="size-8 text-slate-400 hover:text-slate-600">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Paperclip className="size-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No files attached yet</p>
                  <p className="text-xs text-slate-300 mt-1">Upload files to share with your team</p>
                </div>
              )}
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === "comments" && (
            <div className="p-4 space-y-4">
              {/* Comment input */}
              <div className="flex gap-2">
                <div className="size-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">
                  Y
                </div>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Write a comment... Use @ to mention teammates"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                    className="text-sm min-h-[80px] resize-none"
                    rows={3}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="size-7 text-slate-400 hover:text-slate-600">
                        <Paperclip className="size-3.5" />
                      </Button>
                    </div>
                    <Button size="sm" onClick={handleAddComment} disabled={!commentText.trim()}>
                      <Send className="size-3.5 mr-1.5" />
                      Comment
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Comments list */}
              {comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="size-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                        {c.author[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-slate-700">{c.author}</span>
                          <span className="text-xs text-slate-400">{format(c.createdAt, "MMM d, h:mm a")}</span>
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
  const toggleFullScreen = () => setIsFullScreen(!isFullScreen);

  if (isFullScreen) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0 flex flex-col overflow-hidden">
          <DialogTitle className="sr-only">Task Details</DialogTitle>
          <TaskDetailContent
            taskId={taskId}
            workspaceId={workspaceId}
            onClose={handleClose}
            projectKey={projectKey}
            taskIndex={taskIndex}
            isFullScreen={isFullScreen}
            onToggleFullScreen={toggleFullScreen}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0 overflow-hidden" showCloseButton={false}>
        <SheetHeader className="sr-only">
          <SheetTitle>Task Details</SheetTitle>
        </SheetHeader>
        <TaskDetailContent
          taskId={taskId}
          workspaceId={workspaceId}
          onClose={handleClose}
          projectKey={projectKey}
          taskIndex={taskIndex}
          isFullScreen={isFullScreen}
          onToggleFullScreen={toggleFullScreen}
        />
      </SheetContent>
    </Sheet>
  );
}
