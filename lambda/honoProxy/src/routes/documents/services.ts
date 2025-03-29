import { pgConnect } from "../../db";
import { SQSClient } from "@aws-sdk/client-sqs";
import { SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import { BaseDocumentType, ValidImageResult } from "./schema";

export const pgGetDocuments = async (
  limit: number, // default limit is 1mil, default offset is 0 => returns all
  offset: number,
) => {
  try {
    const pgClient = await pgConnect();

    const query = `
            SELECT id, url, description FROM documents
            ORDER BY id DESC LIMIT $1 OFFSET $2
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
             SELECT id, url, description FROM documents WHERE id = $1
    `;

    const { rows } = await pgClient.query(query, [id]);

    await pgClient.end();
    return rows;
  } catch (e) {
    throw new Error(`Error getting document by id`);
  }
};

export const pgDeleteDocument = async (id: number) => {
  try {
    const pgClient = await pgConnect();
    const query = `
      DELETE FROM documents WHERE id = $1 RETURNING id, url, desc;
    `;
    const result = await pgClient.query(query, [id]);
    if (result.rowCount === 0) {
      return { success: false, message: `No document found with ID ${id}` };
    }

    return {
      document: result.rows[0],
      success: true,
      message: `Document with ID ${id} deleted successfully.`,
    };
  } catch (e) {
    throw new Error(`Failed to delete document: ${e}`);
  }
};

const QUEUE_URL =
  "https://sqs.us-east-1.amazonaws.com/982227461113/ingestionQueue";
export async function sendToSQS(
  images: ValidImageResult[],
  sqsClient: SQSClient,
) {
  // Filter out invalid images to avoid sending bad requests
  const validImages = images.filter((image) => image.success);

  if (validImages.length === 0) {
    return { Failed: [], Successful: [] };
  }

  const entries = validImages.map((image, index) => ({
    Id: index.toString(), // Unique identifier per batch message
    MessageBody: JSON.stringify({
      url: image.url,
      desc: image.desc || null,
      timestamp: new Date().toISOString(),
    }),
  }));

  const command = new SendMessageBatchCommand({
    QueueUrl: QUEUE_URL,
    Entries: entries,
  });

  try {
    const response = await sqsClient.send(command);
    return response; // Contains Successful and Failed fields
  } catch (error) {
    console.error("Error sending batch to SQS:", error);
    throw error;
  }
}

import { imageResponseSchema } from "./schema";
export const validateImage = async ({
  url,
  desc,
}: BaseDocumentType): Promise<ValidImageResult> => {
  try {
    if (!url) return { success: true, url, desc, errors: "" };

    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) {
      return {
        success: false,
        url,
        desc,
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
      return { success: false, url, desc, errors };
    }

    return { success: true, url, desc };
  } catch (e: unknown) {
    const errorMessage =
      e instanceof Error
        ? e.message
        : "Unknown error occurred during validation.";
    return { success: false, url, desc, errors: errorMessage };
  }
};
