import { RouteHandler } from "@hono/zod-openapi";

import {
  createDocumentRoute,
  deleteDocumentRoute,
  getDocumentByIdRoute,
  getDocumentsRoute,
} from ".";
import {
  validateImage,
  pgGetDocuments,
  pgGetById,
  pgDeleteDocument,
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
    const queryResults = await pgGetById(id);
    const document = queryResults.rows[0];

    if (!document) {
      return c.json({ error: `Document not found` }, 404);
    }

    return c.json({ document }, 200);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : String(e) }, 400);
  }
};

// [todo]: move all sqs client logic to services file

export const createDocumentHandler: RouteHandler<
  typeof createDocumentRoute
> = async (c) => {
  try {
    const { images } = c.req.valid("json");

    const validatedImages = await Promise.all(images.map(validateImage));
    const sqsResults = await sendToSQS(validatedImages);

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

export const deleteDocumentHandler: RouteHandler<
  typeof deleteDocumentRoute
> = async (c) => {
  try {
    const { id } = c.req.valid("param");

    const { success, message, document } = await pgDeleteDocument(id);

    return c.json({ document, success, message }, 200);
  } catch (e) {
    if (e instanceof Error) {
      return c.json({ error: e.message }, 500);
    } else {
      return c.json({ error: "Internal Server Error" }, 500);
    }
  }
};
