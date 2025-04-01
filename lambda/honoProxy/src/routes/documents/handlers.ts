import { RouteHandler } from "@hono/zod-openapi";
import { partition } from "../utils";
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
        count: documents.length,
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
    const { documents } = c.req.valid("json");
    const [descOnlyDocuments, urlDocuments] = partition(
      documents,
      ({ url, description }) => !!(!url && description),
    );

    const validatedImages = await Promise.all(urlDocuments.map(validateImage));
    const [validImages, invalidImages] = partition(
      validatedImages,
      (doc) => doc.success,
    );

    const validDocuments = [...descOnlyDocuments, ...validImages];
    const sqsResults = await sendToSQS(validDocuments);

    return c.json([...sqsResults, ...invalidImages], 200);
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
    return c.json({ error: "Internal Server Error." }, 500);
  }
};
