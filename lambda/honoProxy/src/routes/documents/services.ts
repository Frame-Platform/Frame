import { pgConnect } from "../../db";
import {
  SQSClient,
  SQSServiceException,
  SendMessageBatchCommand,
} from "@aws-sdk/client-sqs";

import { imageResponseSchema, ValidDocResult } from "./schema";
import { BaseDocumentType } from "../sharedSchemas";
import { Instance } from "aws-cdk-lib/aws-ec2";

const SQS_BATCH_SIZE = 10; //AWS Max = 10

export const pgGetDocuments = async (
  limit: number, // default limit is 1mil, default offset is 0 => returns all
  offset: number,
) => {
  try {
    const pgClient = await pgConnect();

    const query = `
      SELECT id, url, description
      FROM documents
      ORDER BY id DESC
      LIMIT $1
      OFFSET $2
    `;
    const { rows } = await pgClient.query(query, [limit, offset]);
    return rows;
  } catch (e) {
    throw new Error(`Error getting documents: ${e}`);
  }
};

export const pgGetById = async (id: string | number) => {
  try {
    const pgClient = await pgConnect();

    const query = `
      SELECT id, url, description
      FROM documents
      WHERE id = $1;
    `;

    return await pgClient.query(query, [id]);
  } catch (e) {
    throw new Error(`Error getting document by id: ${e}`);
  }
};

export const pgDeleteDocument = async (id: number) => {
  try {
    const pgClient = await pgConnect();
    const query = `
      DELETE FROM documents
      WHERE id = $1
      RETURNING id, url, description;
    `;

    return await pgClient.query(query, [id]);
  } catch (e) {
    throw new Error(`Error occured in pgDeleteDocument: ${e}`);
  }
};

const formatResult = (
  success: boolean,
  errors: string | null | undefined,
  doc: BaseDocumentType,
) => ({
  success,
  ...(errors && { errors }),
  ...(doc?.url && { url: doc.url }),
  ...(doc?.description && { description: doc.description }),
});

export async function sendToSQS(documents: BaseDocumentType[]) {
  const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

  const batches = [];
  for (let i = 0; i < documents.length; i += SQS_BATCH_SIZE) {
    const batch = documents.slice(i, i + SQS_BATCH_SIZE);
    const entries = batch.map((image, index) => ({
      Id: String(i + index),
      MessageBody: JSON.stringify({
        url: image.url,
        description: image.description || null,
        timestamp: new Date().toISOString(),
      }),
    }));
    batches.push(entries);
  }

  const docSendResult: ValidDocResult[] = [];
  for (const entries of batches) {
    try {
      const command = new SendMessageBatchCommand({
        QueueUrl: process.env.QUEUE_URL,
        Entries: entries,
      });

      const { Successful, Failed } = await sqsClient.send(command);

      if (Successful) {
        Successful.forEach((entry) => {
          const doc = documents[Number(entry.Id)];
          docSendResult.push(formatResult(true, null, doc));
        });
      }

      if (Failed) {
        Failed.forEach((entry) => {
          const doc = documents[Number(entry.Id)];
          docSendResult.push(
            formatResult(false, entry.Message || "Unknown Error", doc),
          );
        });
      }
    } catch (error) {
      console.error("Error sending batch to SQS:", error);

      let errorMessage = "Unknown Server Error";
      if (error instanceof SQSServiceException) {
        errorMessage = error.message;
      }

      entries.forEach((entry) => {
        const doc = documents[Number(entry.Id)];
        docSendResult.push(formatResult(false, errorMessage, doc));
      });
    }
  }

  return docSendResult;
}

export const validateImage = async ({ url, description }: BaseDocumentType) => {
  try {
    if (!url) return { success: true, url, description, errors: "" };

    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) {
      return {
        success: false,
        url,
        description,
        errors: `Fetch error: Received ${res.status} status.`,
      };
    }

    const contentType = res.headers.get("content-type");
    const contentLength = res.headers.get("content-length");

    const parsed = imageResponseSchema.safeParse({
      contentType,
      contentLength,
    });

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(", ");
      return { success: false, url, description, errors };
    }

    return { success: true, url, description };
  } catch (e: unknown) {
    const errorMessage =
      e instanceof Error
        ? e.message
        : "Unknown error occurred during validation.";
    return { success: false, url, description, errors: errorMessage };
  }
};
