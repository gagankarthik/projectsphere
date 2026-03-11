import { nanoid } from "nanoid";
import { GetCommand, PutCommand, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLES } from "../client";
import { getUserById } from "./user";

// projectsphere-comments | Key: { commentId }
// GSI: taskId-index (taskId HASH, createdAt RANGE)
const T = TABLES.COMMENTS;

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  author?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

function toComment(i: Record<string, unknown>): Comment {
  return {
    id: i.commentId as string,
    taskId: i.taskId as string,
    authorId: i.authorId as string,
    text: i.text as string,
    createdAt: i.createdAt as string,
    updatedAt: i.updatedAt as string | undefined,
  };
}

export async function createComment(input: {
  taskId: string;
  authorId: string;
  text: string;
}): Promise<Comment> {
  const commentId = nanoid();
  const now = new Date().toISOString();
  const item = {
    commentId,
    taskId: input.taskId,
    authorId: input.authorId,
    text: input.text,
    createdAt: now,
  };
  await dynamodb.send(new PutCommand({ TableName: T, Item: item }));
  return toComment(item);
}

export async function getCommentById(commentId: string): Promise<Comment | null> {
  const res = await dynamodb.send(new GetCommand({ TableName: T, Key: { commentId } }));
  return res.Item ? toComment(res.Item) : null;
}

export async function getTaskComments(taskId: string): Promise<Comment[]> {
  const { Items = [] } = await dynamodb.send(new QueryCommand({
    TableName: T,
    IndexName: "taskId-index",
    KeyConditionExpression: "taskId = :t",
    ExpressionAttributeValues: { ":t": taskId },
    ScanIndexForward: true, // oldest first
  }));

  // Fetch author info for each comment
  const comments = Items.map(toComment);
  const commentsWithAuthors: Comment[] = [];

  for (const comment of comments) {
    const author = await getUserById(comment.authorId);
    commentsWithAuthors.push({
      ...comment,
      author: author ? {
        id: author.id,
        name: author.name,
        email: author.email,
        avatarUrl: author.avatarUrl,
      } : undefined,
    });
  }

  return commentsWithAuthors;
}

export async function deleteComment(commentId: string): Promise<void> {
  await dynamodb.send(new DeleteCommand({ TableName: T, Key: { commentId } }));
}

export async function updateComment(commentId: string, text: string): Promise<Comment | null> {
  const comment = await getCommentById(commentId);
  if (!comment) return null;

  const now = new Date().toISOString();
  const item = {
    commentId,
    taskId: comment.taskId,
    authorId: comment.authorId,
    text,
    createdAt: comment.createdAt,
    updatedAt: now,
  };
  await dynamodb.send(new PutCommand({ TableName: T, Item: item }));
  return toComment(item);
}
