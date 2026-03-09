import { nanoid } from "nanoid";
import { getItem, putItem, updateItem, queryByIndex } from "../operations";
import type { User, UserCreateInput, UserUpdateInput, UserDBItem } from "@/types/user";

export function createUserPK(userId: string): string {
  return `USER#${userId}`;
}

export function createUserSK(): string {
  return "PROFILE";
}

export function createUserEmailGSI(email: string): string {
  return `EMAIL#${email.toLowerCase()}`;
}

function dbItemToUser(item: UserDBItem): User {
  return {
    id: item.id,
    email: item.email,
    name: item.name,
    avatarUrl: item.avatarUrl,
    cognitoSub: item.cognitoSub,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function createUser(input: UserCreateInput): Promise<User> {
  const id = nanoid();
  const now = new Date().toISOString();

  const item: UserDBItem = {
    PK: createUserPK(id),
    SK: createUserSK(),
    GSI3PK: createUserEmailGSI(input.email),
    GSI3SK: "USER",
    id,
    email: input.email.toLowerCase(),
    name: input.name,
    cognitoSub: input.cognitoSub,
    createdAt: now,
    updatedAt: now,
  };

  await putItem(item);
  return dbItemToUser(item);
}

export async function getUserById(userId: string): Promise<User | null> {
  const item = await getItem<UserDBItem>(createUserPK(userId), createUserSK());
  return item ? dbItemToUser(item) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { items } = await queryByIndex<UserDBItem>(
    "GSI3",
    "GSI3PK",
    createUserEmailGSI(email),
    "GSI3SK",
    "USER"
  );

  return items.length > 0 ? dbItemToUser(items[0]) : null;
}

export async function getUserByCognitoSub(cognitoSub: string): Promise<User | null> {
  // For now, we need to query by email since we don't have a GSI for cognitoSub
  // In production, you might want to add a GSI for this
  // This is a limitation that should be addressed with a proper index
  return null;
}

export async function updateUser(userId: string, input: UserUpdateInput): Promise<User | null> {
  const existingUser = await getUserById(userId);
  if (!existingUser) return null;

  const updates: Record<string, unknown> = {
    ...input,
    updatedAt: new Date().toISOString(),
  };

  await updateItem(createUserPK(userId), createUserSK(), updates);

  return getUserById(userId);
}

export async function getOrCreateUser(email: string, name: string, cognitoSub: string): Promise<User> {
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return existingUser;
  }

  return createUser({
    email,
    name,
    cognitoSub,
  });
}
