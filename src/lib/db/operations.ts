import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  BatchWriteCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLE_NAME } from "./client";

export interface QueryOptions {
  indexName?: string;
  limit?: number;
  scanIndexForward?: boolean;
  exclusiveStartKey?: Record<string, unknown>;
  filterExpression?: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: Record<string, unknown>;
}

export async function getItem<T>(pk: string, sk: string): Promise<T | null> {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: pk, SK: sk },
  });

  const response = await dynamodb.send(command);
  return (response.Item as T) || null;
}

export async function putItem<T extends Record<string, unknown>>(item: T): Promise<void> {
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
  });

  await dynamodb.send(command);
}

export async function updateItem(
  pk: string,
  sk: string,
  updates: Record<string, unknown>
): Promise<void> {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, unknown> = {};

  Object.entries(updates).forEach(([key, value], index) => {
    const attrName = `#attr${index}`;
    const attrValue = `:val${index}`;
    updateExpressions.push(`${attrName} = ${attrValue}`);
    expressionAttributeNames[attrName] = key;
    expressionAttributeValues[attrValue] = value;
  });

  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { PK: pk, SK: sk },
    UpdateExpression: `SET ${updateExpressions.join(", ")}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  });

  await dynamodb.send(command);
}

export async function deleteItem(pk: string, sk: string): Promise<void> {
  const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { PK: pk, SK: sk },
  });

  await dynamodb.send(command);
}

export async function queryItems<T>(
  pkValue: string,
  skPrefix?: string,
  options: QueryOptions = {}
): Promise<{ items: T[]; lastKey?: Record<string, unknown> }> {
  let keyConditionExpression = "PK = :pk";
  const expressionAttributeValues: Record<string, unknown> = { ":pk": pkValue };

  if (skPrefix) {
    keyConditionExpression += " AND begins_with(SK, :sk)";
    expressionAttributeValues[":sk"] = skPrefix;
  }

  if (options.expressionAttributeValues) {
    Object.assign(expressionAttributeValues, options.expressionAttributeValues);
  }

  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: options.expressionAttributeNames,
    FilterExpression: options.filterExpression,
    Limit: options.limit,
    ScanIndexForward: options.scanIndexForward ?? true,
    ExclusiveStartKey: options.exclusiveStartKey,
  });

  const response = await dynamodb.send(command);
  return {
    items: (response.Items as T[]) || [],
    lastKey: response.LastEvaluatedKey,
  };
}

export async function queryByIndex<T>(
  indexName: string,
  pkName: string,
  pkValue: string,
  skName?: string,
  skPrefix?: string,
  options: QueryOptions = {}
): Promise<{ items: T[]; lastKey?: Record<string, unknown> }> {
  let keyConditionExpression = `#pk = :pk`;
  const expressionAttributeNames: Record<string, string> = { "#pk": pkName };
  const expressionAttributeValues: Record<string, unknown> = { ":pk": pkValue };

  if (skName && skPrefix) {
    keyConditionExpression += ` AND begins_with(#sk, :sk)`;
    expressionAttributeNames["#sk"] = skName;
    expressionAttributeValues[":sk"] = skPrefix;
  }

  if (options.expressionAttributeNames) {
    Object.assign(expressionAttributeNames, options.expressionAttributeNames);
  }

  if (options.expressionAttributeValues) {
    Object.assign(expressionAttributeValues, options.expressionAttributeValues);
  }

  const command = new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: indexName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    FilterExpression: options.filterExpression,
    Limit: options.limit,
    ScanIndexForward: options.scanIndexForward ?? true,
    ExclusiveStartKey: options.exclusiveStartKey,
  });

  const response = await dynamodb.send(command);
  return {
    items: (response.Items as T[]) || [],
    lastKey: response.LastEvaluatedKey,
  };
}

export async function batchWriteItems(items: { put?: Record<string, unknown>; delete?: { pk: string; sk: string } }[]): Promise<void> {
  const writeRequests = items.map((item) => {
    if (item.put) {
      return { PutRequest: { Item: item.put } };
    } else if (item.delete) {
      return { DeleteRequest: { Key: { PK: item.delete.pk, SK: item.delete.sk } } };
    }
    throw new Error("Invalid batch write item");
  });

  const batches: typeof writeRequests[] = [];
  for (let i = 0; i < writeRequests.length; i += 25) {
    batches.push(writeRequests.slice(i, i + 25));
  }

  for (const batch of batches) {
    const command = new BatchWriteCommand({
      RequestItems: {
        [TABLE_NAME]: batch,
      },
    });

    await dynamodb.send(command);
  }
}

export async function transactWrite(items: {
  put?: Record<string, unknown>;
  update?: { pk: string; sk: string; updates: Record<string, unknown> };
  delete?: { pk: string; sk: string };
  conditionCheck?: { pk: string; sk: string; condition: string; values?: Record<string, unknown> };
}[]): Promise<void> {
  const transactItems = items.map((item) => {
    if (item.put) {
      return { Put: { TableName: TABLE_NAME, Item: item.put } };
    } else if (item.update) {
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, unknown> = {};

      Object.entries(item.update.updates).forEach(([key, value], index) => {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        updateExpressions.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = value;
      });

      return {
        Update: {
          TableName: TABLE_NAME,
          Key: { PK: item.update.pk, SK: item.update.sk },
          UpdateExpression: `SET ${updateExpressions.join(", ")}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
        },
      };
    } else if (item.delete) {
      return {
        Delete: {
          TableName: TABLE_NAME,
          Key: { PK: item.delete.pk, SK: item.delete.sk },
        },
      };
    } else if (item.conditionCheck) {
      return {
        ConditionCheck: {
          TableName: TABLE_NAME,
          Key: { PK: item.conditionCheck.pk, SK: item.conditionCheck.sk },
          ConditionExpression: item.conditionCheck.condition,
          ExpressionAttributeValues: item.conditionCheck.values,
        },
      };
    }
    throw new Error("Invalid transaction item");
  });

  const command = new TransactWriteCommand({
    TransactItems: transactItems,
  });

  await dynamodb.send(command);
}
