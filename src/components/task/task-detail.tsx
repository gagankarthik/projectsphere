"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/shared/user-avatar";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskPriorityBadge } from "./task-priority-badge";
import { useTask } from "@/hooks/use-tasks";
import { updateTaskSchema, type UpdateTaskInput } from "@/validations/task";
import { TASK_STATUSES } from "@/constants/task-status";
import { TASK_PRIORITIES } from "@/constants/task-priority";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface TaskDetailProps {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetail({ taskId, open, onOpenChange }: TaskDetailProps) {
  const { task, isLoading, updateTaskAsync, isUpdating, deleteTaskAsync, isDeleting } = useTask(taskId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
        }
      : undefined,
  });

  const status = watch("status");
  const priority = watch("priority");

  const onSubmit = async (data: UpdateTaskInput) => {
    try {
      await updateTaskAsync(data);
      toast.success("Task updated");
      setIsEditing(false);
    } catch (err) {
      toast.error("Failed to update task");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTaskAsync();
      toast.success("Task deleted");
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to delete task");
    }
  };

  const handleQuickStatusChange = async (newStatus: string) => {
    try {
      await updateTaskAsync({ status: newStatus as any });
      toast.success("Status updated");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleQuickPriorityChange = async (newPriority: string) => {
    try {
      await updateTaskAsync({ priority: newPriority as any });
      toast.success("Priority updated");
    } catch (err) {
      toast.error("Failed to update priority");
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner size="lg" />
            </div>
          ) : task ? (
            <>
              <SheetHeader>
                <SheetTitle className="text-left pr-6">{task.title}</SheetTitle>
                <SheetDescription className="text-left">
                  Created {format(new Date(task.createdAt), "MMM d, yyyy")}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="flex flex-wrap gap-2">
                  <Select value={task.status} onValueChange={handleQuickStatusChange}>
                    <SelectTrigger className="w-fit">
                      <TaskStatusBadge status={task.status} />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={task.priority} onValueChange={handleQuickPriorityChange}>
                    <SelectTrigger className="w-fit">
                      <TaskPriorityBadge priority={task.priority} />
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

                <Separator />

                {isEditing ? (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        {...register("title")}
                        aria-invalid={!!errors.title}
                      />
                      {errors.title && (
                        <p className="text-sm text-destructive">{errors.title.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        rows={5}
                        {...register("description")}
                        aria-invalid={!!errors.description}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        {...register("dueDate")}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={isUpdating || !isDirty}>
                        {isUpdating && <LoadingSpinner size="sm" className="mr-2" />}
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          reset();
                          setIsEditing(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {task.description || "No description"}
                      </p>
                    </div>

                    {task.dueDate && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Due Date</h4>
                        <p className="text-sm">
                          {format(new Date(task.dueDate), "MMMM d, yyyy")}
                        </p>
                      </div>
                    )}

                    {task.assignee && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Assignee</h4>
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            name={task.assignee.name}
                            email={task.assignee.email}
                            avatarUrl={task.assignee.avatarUrl}
                            size="sm"
                          />
                          <span className="text-sm">{task.assignee.name}</span>
                        </div>
                      </div>
                    )}

                    {task.reporter && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Reporter</h4>
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            name={task.reporter.name}
                            email={task.reporter.email}
                            avatarUrl={task.reporter.avatarUrl}
                            size="sm"
                          />
                          <span className="text-sm">{task.reporter.name}</span>
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="flex gap-2">
                      <Button onClick={() => setIsEditing(true)}>Edit</Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Task not found</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete task?"
        description="This action cannot be undone. This task will be permanently deleted."
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  );
}
