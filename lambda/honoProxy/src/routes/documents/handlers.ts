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
    console.log(`Error in getDocumentsHandler: ${e}`);
    return c.json({ error: "Internal Server Error." }, 500);
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
      return c.json({ error: `Document Not Found` }, 404);
    }

    return c.json({ document }, 200);
  } catch (e) {
    console.log(`Error in getDocumentsByIdHandler: ${e}`);
    return c.json({ error: "Internal Server Error." }, 500);
  }
};

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
    console.log(`Error in createDocumentHandler: ${e}`);
    return c.json({ error: "Internal Server Error." }, 500);
  }
};

export const deleteDocumentHandler: RouteHandler<
  typeof deleteDocumentRoute
> = async (c) => {
  try {
    const { id } = c.req.valid("param");

    const queryResult = await pgDeleteDocument(id);

    if (queryResult.rowCount === 0) {
      return c.json({ error: "Document Not Found" }, 404);
    }

    return c.json({ document: queryResult.rows[0] }, 200);
  } catch (e) {
    console.log(`Error in deleteDocumentHandler: ${e}`);
    return c.json({ error: "Internal server error." }, 500);
  }
};
