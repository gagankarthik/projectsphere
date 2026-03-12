import { NextRequest } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/entities/user";
import { getUserWorkspaceRole } from "@/lib/db/entities/workspace";
import { getProjectById } from "@/lib/db/entities/project";
import { successResponse, errorResponse } from "@/lib/api/response";
import { UnauthorizedError, NotFoundError, ForbiddenError, ValidationError } from "@/lib/api/errors";
import { dynamodb, TABLES } from "@/lib/db/client";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

const createDiscussionSchema = z.object({
  text: z.string().min(1, "Comment text is required").max(5000),
});

interface Discussion {
  id: string;
  projectId: string;
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

function toDiscussion(item: Record<string, unknown>): Discussion {
  return {
    id: item.discussionId as string,
    projectId: item.projectId as string,
    authorId: item.authorId as string,
    text: item.text as string,
    createdAt: item.createdAt as string,
  };
}

// GET - Fetch all discussions for a project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;

    const authUser = await getCurrentUser();
    if (!authUser) {
      throw new UnauthorizedError();
    }

    const user = await getUserById(authUser.id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const project = await getProjectById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const workspaceRole = await getUserWorkspaceRole(project.workspaceId, user.id);
    if (!workspaceRole) {
      throw new ForbiddenError("You don't have access to this project");
    }

    // Query discussions for this project
    const { Items = [] } = await dynamodb.send(new QueryCommand({
      TableName: TABLES.DISCUSSIONS,
      IndexName: "projectId-index",
      KeyConditionExpression: "projectId = :p",
      ExpressionAttributeValues: { ":p": projectId },
      ScanIndexForward: true, // oldest first
    }));

    // Fetch author info for each discussion
    const discussions: Discussion[] = [];
    for (const item of Items) {
      const discussion = toDiscussion(item);
      const author = await getUserById(discussion.authorId);
      discussions.push({
        ...discussion,
        author: author ? {
          id: author.id,
          name: author.name,
          email: author.email,
          avatarUrl: author.avatarUrl,
        } : undefined,
      });
    }

    return successResponse(discussions);
  } catch (error) {
    return errorResponse(error);
  }
}

// POST - Create a new discussion
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;

    const authUser = await getCurrentUser();
    if (!authUser) {
      throw new UnauthorizedError();
    }

    const user = await getUserById(authUser.id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const project = await getProjectById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const workspaceRole = await getUserWorkspaceRole(project.workspaceId, user.id);
    if (!workspaceRole) {
      throw new ForbiddenError("You don't have access to this project");
    }

    const body = await request.json();
    const parsed = createDiscussionSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0].message);
    }

    const discussionId = nanoid();
    const now = new Date().toISOString();
    const item = {
      discussionId,
      projectId,
      authorId: user.id,
      text: parsed.data.text,
      createdAt: now,
    };

    await dynamodb.send(new PutCommand({
      TableName: TABLES.DISCUSSIONS,
      Item: item,
    }));

    const discussion: Discussion = {
      ...toDiscussion(item),
      author: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    };

    return successResponse(discussion, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
