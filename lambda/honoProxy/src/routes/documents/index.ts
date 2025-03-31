import { createRoute } from "@hono/zod-openapi";
import { errorResponseSchema, apiKeySchema } from "../sharedSchemas";
import { z } from "@hono/zod-openapi";
import {
  idPathSchema,
  paginationSchema,
  validateImageResultSchema,
  documentReturnSchema,
  documentSchema,
} from "./schema";

export const getDocumentsRoute = createRoute({
  method: "get",
  path: "/document",
  description: "Get a paginated list of documents",
  request: {
    headers: z.object({
      "x-api-key": apiKeySchema,
    }),
    query: paginationSchema.describe("Pagination query parameters"),
    description:
      "Retrieve a paginated list of documents. Defaults to returning all documents unless limit/offset are provided.",
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
          example: {
            documents: [
              {
                id: 1,
                url: "https://example.com/pic1.png",
                description: "First image",
              },
              {
                id: 2,
                url: "https://example.com/pic2.png",
                description: "Second image",
              },
            ],
            limit: 2,
            offset: 0,
            total: 2,
          },
        },
      },
    },
    500: {
      description: "Server Error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
          example: { error: "Internal Server Error." },
        },
      },
    },
  },
});

export const getDocumentByIdRoute = createRoute({
  method: "get",
  path: "/document/{id}",
  description: "Find a document by an ID",
  request: {
    headers: z.object({
      "x-api-key": apiKeySchema,
    }),
    params: idPathSchema.describe("Path parameter for document ID"),
    description:
      "Retrieve a document by its numeric ID. The ID must be a non-negative integer.",
  },
  responses: {
    200: {
      description: "The document was found and returned successfully.",
      content: {
        "application/json": {
          schema: z.object({
            document: documentReturnSchema,
          }),
          example: {
            document: {
              id: 7,
              url: "https://example.com/monkeyselfie.jpeg",
              description: "An image of monkey takign a selfie.",
            },
          },
        },
      },
    },
    404: {
      description: "Document Not Found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
          example: { error: "Document Not Found" },
        },
      },
    },
    500: {
      description: "Bad Request",
      content: {
        "application/json": {
          schema: errorResponseSchema,
          example: { error: "Internal Server Error." },
        },
      },
    },
  },
});

export const createDocumentRoute = createRoute({
  method: "post",
  path: "/document",
  description: "Add new document(s)",
  request: {
    headers: z.object({
      "x-api-key": apiKeySchema,
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({ images: z.array(documentSchema) }),
          example: {
            images: [
              {
                url: "https://example.com/image1.jpg",
                description: "A photo of the Colosseum in Rome",
              },
              {
                description: "An image with no URL, only a description",
              },
            ],
          },
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
          example: [
            {
              url: "https://example.com/image1.jpg",
              description: "A photo of the Colosseum in Rome",
              success: true,
            },
            {
              description: "An image with no URL, only a description",
              success: true,
            },
            {
              url: null,
              description: null,
              success: false,
              errors: "At least one of url or description must be provided.",
            },
          ],
        },
      },
    },
    500: {
      description: "Server Error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
          example: { error: "Internal Server Error." },
        },
      },
    },
  },
});

export const deleteDocumentRoute = createRoute({
  method: "delete",
  path: "/document/{id}",
  description: "Deleteing a document",
  request: {
    headers: z.object({
      "x-api-key": apiKeySchema,
    }),
    params: idPathSchema.describe("Path parameter for document ID"),
    description:
      "Delete a document by its numeric ID. ID must be a non-negative integer.",
  },
  responses: {
    200: {
      description: "Document successfully deleted",
      content: {
        "application/json": {
          schema: z.object({
            document: documentReturnSchema,
          }),
          example: {
            document: {
              id: 42,
              url: "https://example.com/resource.pdf",
              description: "A sample document",
            },
          },
        },
      },
    },
    404: {
      description: "Document not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
          example: { error: "Document Not Found" },
        },
      },
    },
    500: {
      description: "Server Error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
          example: { error: "Internal Server Error." },
        },
      },
    },
  },
});
