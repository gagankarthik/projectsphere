"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ProjectHeader } from "@/components/project/project-header";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useProject } from "@/hooks/use-projects";
import { useTasks } from "@/hooks/use-tasks";
import { MessageSquare, ArrowRight } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  text: string;
  createdAt: string;
  author?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

interface CommentWithTask extends Comment {
  taskTitle: string;
}

interface CommentsPageProps {
  params: Promise<{ workspaceId: string; projectId: string }>;
}

export default function CommentsPage({ params }: CommentsPageProps) {
  const { workspaceId, projectId } = use(params);
  const { project, isLoading: projectLoading } = useProject(projectId);
  const { tasks, isLoading: tasksLoading } = useTasks(projectId);
  const [comments, setComments] = useState<CommentWithTask[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  // Fetch comments for all tasks
  useEffect(() => {
    if (tasksLoading || tasks.length === 0) {
      setCommentsLoading(false);
      return;
    }

    const fetchAllComments = async () => {
      setCommentsLoading(true);
      const allComments: CommentWithTask[] = [];

      for (const task of tasks) {
        try {
          const res = await fetch(`/api/tasks/${task.id}/comments`);
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              const taskComments = json.data.map((c: Comment) => ({
                ...c,
                taskTitle: task.title,
              }));
              allComments.push(...taskComments);
            }
          }
        } catch {
          // Skip failed requests
        }
      }

      // Sort by newest first
      allComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setComments(allComments);
      setCommentsLoading(false);
    };

    fetchAllComments();
  }, [tasks, tasksLoading]);

  if (projectLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        description="The project you're looking for doesn't exist."
        action={
          <Button asChild>
            <Link href={`/dashboard/workspaces/${workspaceId}/projects`}>Back to projects</Link>
          </Button>
        }
      />
    );
  }

  const isLoading = tasksLoading || commentsLoading;

  return (
    <div className="flex flex-col gap-6">
      <ProjectHeader project={project} workspaceId={workspaceId} currentView="comments" />

      <div>
        <h2 className="text-xl font-semibold">All Comments</h2>
        <p className="text-muted-foreground text-sm">Comments across all tasks in this project</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground/40" />
            <div className="text-center">
              <h3 className="font-medium">No comments yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Comments will appear here when team members add them to tasks
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/workspaces/${workspaceId}/projects/${projectId}/tasks`}>
                Go to Tasks
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={comment.author?.avatarUrl} />
                    <AvatarFallback>
                      {comment.author?.name?.slice(0, 2).toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {comment.author?.name || "Unknown User"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      on <span className="font-medium text-foreground">{comment.taskTitle}</span>
                    </p>
                    <p className="mt-2 text-sm whitespace-pre-wrap">{comment.text}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
