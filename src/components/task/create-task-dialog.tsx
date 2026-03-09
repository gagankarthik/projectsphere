"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskForm } from "./task-form";
import type { CreateTaskInput } from "@/validations/task";
import type { TaskStatus } from "@/types/task";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTaskInput) => Promise<void>;
  isSubmitting?: boolean;
  defaultStatus?: TaskStatus;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  defaultStatus,
}: CreateTaskDialogProps) {
  const handleSubmit = async (data: CreateTaskInput) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>
            Add a new task to this project
          </DialogDescription>
        </DialogHeader>
        <TaskForm
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
          defaultValues={{ status: defaultStatus }}
        />
      </DialogContent>
    </Dialog>
  );
}
