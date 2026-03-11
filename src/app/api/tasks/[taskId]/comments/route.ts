import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/entities/user";
import { getUserWorkspaceRole } from "@/lib/db/entities/workspace";
import { getTaskById } from "@/lib/db/entities/task";
import { getTaskComments, createComment } from "@/lib/db/entities/comment";
import { successResponse, errorResponse } from "@/lib/api/response";
import { UnauthorizedError, NotFoundError, ForbiddenError, ValidationError } from "@/lib/api/errors";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ taskId: string }>;
}

const createCommentSchema = z.object({
  text: z.string().min(1, "Comment text is required").max(5000, "Comment must be less than 5000 characters"),
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { taskId } = await params;

    const authUser = await getCurrentUser();
    if (!authUser) {
      throw new UnauthorizedError();
    }

    const user = await getUserById(authUser.id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const task = await getTaskById(taskId);
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    // Check workspace membership
    const workspaceRole = await getUserWorkspaceRole(task.workspaceId, user.id);
    if (!workspaceRole) {
      throw new ForbiddenError("You don't have access to this task");
    }

    const comments = await getTaskComments(taskId);
    return successResponse(comments);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { taskId } = await params;

    const authUser = await getCurrentUser();
    if (!authUser) {
      throw new UnauthorizedError();
    }

    const user = await getUserById(authUser.id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const task = await getTaskById(taskId);
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    // Check workspace membership
    const workspaceRole = await getUserWorkspaceRole(task.workspaceId, user.id);
    if (!workspaceRole) {
      throw new ForbiddenError("You don't have access to this task");
    }

    // Viewers cannot add comments
    if (workspaceRole === "viewer") {
      throw new ForbiddenError("Viewers cannot add comments");
    }

    const body = await request.json();
    const parsed = createCommentSchema.parse(body);

    const comment = await createComment({
      taskId,
      authorId: user.id,
      text: parsed.text,
    });

    // Include author info in response
    const commentWithAuthor = {
      ...comment,
      author: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    };

    return successResponse(commentWithAuthor);
  } catch (error) {
    return errorResponse(error);
  }
}
