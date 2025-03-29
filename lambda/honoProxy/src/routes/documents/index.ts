import { createRoute } from "@hono/zod-openapi";
import { errorResponseSchema } from "../sharedSchemas";
import { z } from "@hono/zod-openapi";
import {
  idPathSchema,
  paginationSchema,
  createDocumentSchema,
  validateImageResultSchema,
  documentReturnSchema,
} from "./schema";

export const getDocumentsRoute = createRoute({
  method: "get",
  path: "/document",
  request: {
    query: paginationSchema,
    description: "Retrieves a paginated list of documents",
  },
  responses: {
    200: {
      description: "Successful retrieval of documents",
      content: {
        "application/json": {
          schema: z.object({
            documents: z.array(documentReturnSchema),
            limit: z.number(),
            offset: z.number(),
            total: z.number(),
          }),
        },
      },
    },
    400: {
      description: "Bad Request",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

export const getDocumentByIdRoute = createRoute({
  method: "get",
  path: "/document/{id}",
  request: {
    params: idPathSchema,
    description: "Retrieves a specific document by ID",
  },
  responses: {
    200: {
      description: "Successful retrieval of the document",
      content: {
        "application/json": {
          schema: z.object({
            document: documentReturnSchema,
          }),
        },
      },
    },
    400: {
      description: "Bad Request",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

export const createDocumentRoute = createRoute({
  method: "post",
  path: "/document",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createDocumentSchema,
        },
      },
      description:
        "Receives images via URL and optional descriptions and queues them for embedding.",
    },
  },
  responses: {
    200: {
      description: "Validation results of images.",
      content: {
        "application/json": {
          schema: z.array(validateImageResultSchema),
        },
      },
    },
    400: {
      description: "Bad Request",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

export const deleteDocumentRoute = createRoute({
  method: "delete",
  path: "/delete/{id}",
  request: {
    params: idPathSchema,
    description: "Deletes a specific document by ID",
  },
  responses: {
    200: {
      description: "Successful deletion of the document",
      content: {
        "application/json": {
          schema: z.object({
            document: documentReturnSchema,
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    400: {
      description: "Bad Request",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Server Error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
