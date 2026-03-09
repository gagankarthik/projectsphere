import { nanoid } from "nanoid";
import { getItem, putItem, updateItem, deleteItem, queryItems, queryByIndex, batchWriteItems } from "../operations";
import { getUserById } from "./user";
import { getProjectById, incrementProjectTaskCount, decrementProjectTaskCount } from "./project";
import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskStatus,
  TaskDBItem,
  TaskFilters
} from "@/types/task";

export function createProjectPK(projectId: string): string {
  return `PROJECT#${projectId}`;
}

export function createTaskSK(taskId: string): string {
  return `TASK#${taskId}`;
}

export function createTaskPK(taskId: string): string {
  return `TASK#${taskId}`;
}

export function createAssigneeGSI(assigneeId?: string): string {
  return assigneeId ? `ASSIGNEE#${assigneeId}` : "UNASSIGNED";
}

export function createDueDateGSI(dueDate?: string): string {
  return `DUEDATE#${dueDate || "9999-12-31"}`;
}

export function createStatusOrderGSI(projectId: string, status: TaskStatus): string {
  return `PROJECT#${projectId}#STATUS#${status}`;
}

export function createOrderGSI(order: number): string {
  return `ORDER#${order.toString().padStart(10, "0")}`;
}

function dbItemToTask(item: TaskDBItem): Task {
  return {
    id: item.id,
    projectId: item.projectId,
    workspaceId: item.workspaceId,
    title: item.title,
    description: item.description,
    status: item.status,
    priority: item.priority,
    assigneeId: item.assigneeId,
    reporterId: item.reporterId,
    dueDate: item.dueDate,
    labels: item.labels || [],
    parentTaskId: item.parentTaskId,
    order: item.order,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

async function enrichTaskWithUsers(task: Task): Promise<Task> {
  if (task.assigneeId) {
    const assignee = await getUserById(task.assigneeId);
    if (assignee) {
      task.assignee = {
        id: assignee.id,
        name: assignee.name,
        email: assignee.email,
        avatarUrl: assignee.avatarUrl,
      };
    }
  }

  const reporter = await getUserById(task.reporterId);
  if (reporter) {
    task.reporter = {
      id: reporter.id,
      name: reporter.name,
      email: reporter.email,
      avatarUrl: reporter.avatarUrl,
    };
  }

  return task;
}

export async function createTask(
  projectId: string,
  input: TaskCreateInput,
  reporterId: string
): Promise<Task> {
  const project = await getProjectById(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  const id = nanoid();
  const now = new Date().toISOString();
  const status = input.status || "todo";
  const priority = input.priority || "medium";

  // Get the highest order for this status
  const { items: existingTasks } = await queryByIndex<TaskDBItem>(
    "GSI4",
    "GSI4PK",
    createStatusOrderGSI(projectId, status),
    undefined,
    undefined,
    { scanIndexForward: false, limit: 1 }
  );

  const order = existingTasks.length > 0 ? existingTasks[0].order + 1 : 0;

  const item: TaskDBItem = {
    PK: createProjectPK(projectId),
    SK: createTaskSK(id),
    GSI1PK: createTaskPK(id),
    GSI1SK: "METADATA",
    GSI2PK: createAssigneeGSI(input.assigneeId),
    GSI2SK: createDueDateGSI(input.dueDate),
    GSI4PK: createStatusOrderGSI(projectId, status),
    GSI4SK: createOrderGSI(order),
    id,
    projectId,
    workspaceId: project.workspaceId,
    title: input.title,
    description: input.description,
    status,
    priority,
    assigneeId: input.assigneeId,
    reporterId,
    dueDate: input.dueDate,
    labels: input.labels || [],
    parentTaskId: input.parentTaskId,
    order,
    createdAt: now,
    updatedAt: now,
  };

  await putItem(item);
  await incrementProjectTaskCount(projectId);

  const task = dbItemToTask(item);
  return enrichTaskWithUsers(task);
}

export async function getTaskById(taskId: string): Promise<Task | null> {
  const { items } = await queryByIndex<TaskDBItem>(
    "GSI1",
    "GSI1PK",
    createTaskPK(taskId),
    "GSI1SK",
    "METADATA"
  );

  if (items.length === 0) return null;

  const task = dbItemToTask(items[0]);
  return enrichTaskWithUsers(task);
}

export async function getProjectTasks(projectId: string, filters?: TaskFilters): Promise<Task[]> {
  const { items } = await queryItems<TaskDBItem>(createProjectPK(projectId), "TASK#");

  let tasks = items.map(dbItemToTask);

  // Apply filters
  if (filters) {
    if (filters.status && filters.status.length > 0) {
      tasks = tasks.filter((t) => filters.status!.includes(t.status));
    }
    if (filters.priority && filters.priority.length > 0) {
      tasks = tasks.filter((t) => filters.priority!.includes(t.priority));
    }
    if (filters.assigneeId) {
      tasks = tasks.filter((t) => t.assigneeId === filters.assigneeId);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(search) ||
          t.description?.toLowerCase().includes(search)
      );
    }
  }

  // Sort by order
  tasks.sort((a, b) => a.order - b.order);

  // Enrich with user data
  return Promise.all(tasks.map(enrichTaskWithUsers));
}

export async function getTasksByStatus(projectId: string, status: TaskStatus): Promise<Task[]> {
  const { items } = await queryByIndex<TaskDBItem>(
    "GSI4",
    "GSI4PK",
    createStatusOrderGSI(projectId, status)
  );

  const tasks = items.map(dbItemToTask);
  return Promise.all(tasks.map(enrichTaskWithUsers));
}

export async function updateTask(taskId: string, input: TaskUpdateInput): Promise<Task | null> {
  const existingTask = await getTaskById(taskId);
  if (!existingTask) return null;

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    ...input,
    updatedAt: now,
  };

  // Handle status change - update GSI4
  if (input.status && input.status !== existingTask.status) {
    updates.GSI4PK = createStatusOrderGSI(existingTask.projectId, input.status);

    // Get the highest order for the new status if order is not provided
    if (input.order === undefined) {
      const { items } = await queryByIndex<TaskDBItem>(
        "GSI4",
        "GSI4PK",
        createStatusOrderGSI(existingTask.projectId, input.status),
        undefined,
        undefined,
        { scanIndexForward: false, limit: 1 }
      );
      const newOrder = items.length > 0 ? items[0].order + 1 : 0;
      updates.order = newOrder;
      updates.GSI4SK = createOrderGSI(newOrder);
    }
  }

  // Handle order change
  if (input.order !== undefined) {
    updates.GSI4SK = createOrderGSI(input.order);
  }

  // Handle assignee change
  if (input.assigneeId !== undefined) {
    updates.GSI2PK = createAssigneeGSI(input.assigneeId || undefined);
  }

  // Handle due date change
  if (input.dueDate !== undefined) {
    updates.GSI2SK = createDueDateGSI(input.dueDate || undefined);
  }

  await updateItem(
    createProjectPK(existingTask.projectId),
    createTaskSK(taskId),
    updates
  );

  return getTaskById(taskId);
}

export async function deleteTask(taskId: string): Promise<void> {
  const task = await getTaskById(taskId);
  if (!task) return;

  await deleteItem(createProjectPK(task.projectId), createTaskSK(taskId));
  await decrementProjectTaskCount(task.projectId);

  // Also delete any subtasks
  const { items: subtasks } = await queryItems<TaskDBItem>(
    createProjectPK(task.projectId),
    "TASK#",
    {
      filterExpression: "parentTaskId = :parentId",
      expressionAttributeValues: { ":parentId": taskId },
    }
  );

  if (subtasks.length > 0) {
    await batchWriteItems(
      subtasks.map((st) => ({ delete: { pk: st.PK, sk: st.SK } }))
    );
  }
}

export async function reorderTask(
  taskId: string,
  newStatus: TaskStatus,
  newOrder: number
): Promise<Task | null> {
  const task = await getTaskById(taskId);
  if (!task) return null;

  const updates: Record<string, unknown> = {
    status: newStatus,
    order: newOrder,
    GSI4PK: createStatusOrderGSI(task.projectId, newStatus),
    GSI4SK: createOrderGSI(newOrder),
    updatedAt: new Date().toISOString(),
  };

  await updateItem(
    createProjectPK(task.projectId),
    createTaskSK(taskId),
    updates
  );

  return getTaskById(taskId);
}

export async function getSubtasks(parentTaskId: string): Promise<Task[]> {
  const task = await getTaskById(parentTaskId);
  if (!task) return [];

  const { items } = await queryItems<TaskDBItem>(
    createProjectPK(task.projectId),
    "TASK#",
    {
      filterExpression: "parentTaskId = :parentId",
      expressionAttributeValues: { ":parentId": parentTaskId },
    }
  );

  const subtasks = items.map(dbItemToTask);
  return Promise.all(subtasks.map(enrichTaskWithUsers));
}

export async function getUserAssignedTasks(userId: string): Promise<Task[]> {
  const { items } = await queryByIndex<TaskDBItem>(
    "GSI2",
    "GSI2PK",
    createAssigneeGSI(userId)
  );

  const tasks = items.map(dbItemToTask);
  return Promise.all(tasks.map(enrichTaskWithUsers));
}

export async function reorderTasksInColumn(
  projectId: string,
  status: TaskStatus,
  taskIds: string[]
): Promise<void> {
  const updates = taskIds.map((taskId, index) => ({
    update: {
      pk: createProjectPK(projectId),
      sk: createTaskSK(taskId),
      updates: {
        order: index,
        GSI4SK: createOrderGSI(index),
        updatedAt: new Date().toISOString(),
      },
    },
  }));

  // Process in batches of 25 (DynamoDB limit)
  for (let i = 0; i < updates.length; i += 25) {
    const batch = updates.slice(i, i + 25);
    await batchWriteItems(
      batch.map((u) => ({
        put: {
          PK: u.update.pk,
          SK: u.update.sk,
          ...u.update.updates,
        },
      }))
    );
  }
}
