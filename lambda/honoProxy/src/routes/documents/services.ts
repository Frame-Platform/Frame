import { pgConnect } from "../../db";
import {
  SQSClient,
  SQSServiceException,
  SendMessageBatchCommand,
} from "@aws-sdk/client-sqs";

import { imageResponseSchema, ValidDocResult } from "./schema";
import { BaseDocumentType } from "../sharedSchemas";

const SQS_BATCH_SIZE = 10; //AWS Max = 10

export const pgGetDocuments = async (limit: number, offset: number) => {
  try {
    const pgClient = await pgConnect();

    const query = `
      SELECT id, url, description, metadata
      FROM documents4
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
      SELECT id, url, description, metadata
      FROM documents4
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
      DELETE FROM documents4
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
  { url, description, metadata }: BaseDocumentType,
) => ({
  success,
  ...(errors && { errors }),
  ...(url && { url: url }),
  ...(description && { description: description }),
  ...(metadata && { metadata: metadata }),
});

export async function sendToSQS(documents: BaseDocumentType[]) {
  const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

  const batches = [];
  for (let i = 0; i < documents.length; i += SQS_BATCH_SIZE) {
    const batch = documents.slice(i, i + SQS_BATCH_SIZE);
    const entries = batch.map(({ url, description, metadata }, index) => ({
      Id: String(i + index),
      MessageBody: JSON.stringify({
        ...{ url, description, metadata },
        timestamp: new Date().toISOString(),
      }),
    }));
    batches.push(entries);
  }

  const docSendResult: ValidDocResult[] = [];
  for (const entries of batches) {
    try {
      const command = new SendMessageBatchCommand({
        QueueUrl: process.env.DOCUMENT_QUEUE_URL,
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

export const validateImage = async (document: BaseDocumentType) => {
  try {
    if (!document.url) {
      return { success: true, ...document };
    }

    const res = await fetch(document.url, { method: "HEAD" });
    if (!res.ok) {
      return {
        success: false,
        errors: `Fetch error: Received ${res.status} status.`,
        ...document,
      };
    }

    const parsed = imageResponseSchema.safeParse({
      contentType: res.headers.get("content-type"),
      contentLength: res.headers.get("content-length"),
    });

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(", ");
      return { success: false, errors, ...document };
    }

    return { success: true, ...document };
  } catch (e: unknown) {
    console.log(e);
    let errorMessage = "Unknown error occurred during validation.";
    if (e instanceof Error) {
      errorMessage = e.message;
    }
    return { success: false, errors: errorMessage, ...document };
  }
};
