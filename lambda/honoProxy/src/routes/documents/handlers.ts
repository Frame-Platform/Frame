import { RouteHandler } from "@hono/zod-openapi";

import {
  createDocumentRoute,
  getDocumentByIdRoute,
  getDocumentsRoute,
} from ".";
import {
  validateImage,
  pgGetDocuments,
  pgGetById,
  sendToSQS,
} from "./services";

export const getDocumentsHandler: RouteHandler<
  typeof getDocumentsRoute
> = async (c) => {
  try {
    const { limit, offset } = c.req.valid("query");
    const documents = await pgGetDocuments(limit, offset);

    return c.json(
      {
        documents,
        limit,
        offset,
        total: documents.length,
      },
      200,
    );
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : String(e) }, 400);
  }
};

export const getDocumentByIdHandler: RouteHandler<
  typeof getDocumentByIdRoute
> = async (c) => {
  try {
    const { id } = c.req.valid("param");
    const document = await pgGetById(id);

    return c.json({ document }, 200);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : String(e) }, 400);
  }
};

// [todo]: move all sqs client logic to services file
import { SQSClient } from "@aws-sdk/client-sqs";
const REGION = "us-east-1";

export const createDocumentHandler: RouteHandler<
  typeof createDocumentRoute
> = async (c) => {
  try {
    const { images } = c.req.valid("json");
    const sqsClient = new SQSClient({ region: REGION });
    const validatedImages = await Promise.all(images.map(validateImage));
    const sqsResults = await sendToSQS(validatedImages, sqsClient);

    const successfulMessages = sqsResults.Successful || [];
    const failedMessages = sqsResults.Failed || [];

    const messageStatuses = validatedImages.map((image, index) => {
      const successEntry = successfulMessages.find(
        (msg) => msg.Id === index.toString(),
      );
      const failedEntry = failedMessages.find(
        (msg) => msg.Id === index.toString(),
      );

      return {
        url: image.url,
        desc: image.desc,
        success: !!successEntry,
        errors: failedEntry ? failedEntry.Message || "Unknown Error" : "",
      };
    });

    return c.json(messageStatuses, 200);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : String(e) }, 400);
  }
};
