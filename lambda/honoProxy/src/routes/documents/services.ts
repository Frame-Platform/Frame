import { pgConnect } from "../../db";
import { SQSClient } from "@aws-sdk/client-sqs";
import { SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import { imageResponseSchema, ValidImageResult } from "./schema";
import { BaseDocumentType } from "../sharedSchemas";

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

export async function sendToSQS(images: ValidImageResult[]) {
  const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
  const validImages = images.filter((image) => image.success);

  if (validImages.length === 0) {
    return { Failed: [], Successful: [] };
  }

  const chunkSize = 10;
  const successfulMessages: any[] = [];
  const failedMessages: any[] = [];

  for (let i = 0; i < validImages.length; i += chunkSize) {
    const batch = validImages.slice(i, i + chunkSize);
    const entries = batch.map((image, index) => ({
      Id: (i + index).toString(),
      MessageBody: JSON.stringify({
        url: image.url,
        description: image.description || null,
        timestamp: new Date().toISOString(),
      }),
    }));

    const command = new SendMessageBatchCommand({
      QueueUrl: process.env.QUEUE_URL,
      Entries: entries,
    });

    try {
      const response = await sqsClient.send(command);
      successfulMessages.push(...(response.Successful || []));
      failedMessages.push(...(response.Failed || []));
    } catch (error) {
      console.error("Error sending batch to SQS:", error);
      failedMessages.push(
        ...entries.map((entry) => ({
          Id: entry.Id,
          Message: error instanceof Error ? error.message : "Unknown error",
        })),
      );
    }
  }

  return { Successful: successfulMessages, Failed: failedMessages };
}

// export async function sendToSQS(images: ValidImageResult[]) {
//   const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
//   const validImages = images.filter((image) => image.success);

//   if (validImages.length === 0) {
//     return { Failed: [], Successful: [] };
//   }

//   const entries = validImages.map((image, index) => ({
//     Id: index.toString(), // Unique identifier per batch message
//     MessageBody: JSON.stringify({
//       url: image.url,
//       desc: image.desc || null,
//       timestamp: new Date().toISOString(),
//     }),
//   }));

//   const command = new SendMessageBatchCommand({
//     QueueUrl: process.env.QUEUE_URL,
//     Entries: entries,
//   });

//   try {
//     const response = await sqsClient.send(command);
//     return response; // Contains Successful and Failed fields
//   } catch (error) {
//     console.error("Error sending batch to SQS:", error);
//     throw error;
//   }
// }

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
