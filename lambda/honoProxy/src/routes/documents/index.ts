import { createRoute } from "@hono/zod-openapi";
import { errorResponseSchema } from "../sharedSchemas";
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
  request: {
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
                desc: "First image",
              },
              {
                id: 2,
                url: "https://example.com/pic2.png",
                desc: "Second image",
              },
            ],
            limit: 2,
            offset: 0,
            total: 25,
          },
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
              desc: "An image of monkey takign a selfie.",
            },
          },
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
          schema: z.object({ images: z.array(documentSchema) }),
          example: {
            images: [
              {
                url: "https://example.com/image1.jpg",
                desc: "A photo of the Colosseum in Rome",
              },
              {
                desc: "An image with no URL, only a description",
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
              desc: "A photo of the Colosseum in Rome",
              success: true,
            },
            {
              desc: "An image with no URL, only a description",
              success: true,
            },
            {
              url: null,
              desc: null,
              success: false,
              errors: "At least one of url or desc must be provided.",
            },
          ],
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
            success: z.boolean(),
            message: z.string(),
          }),
          example: {
            document: {
              id: 42,
              url: "https://example.com/resource.pdf",
              desc: "A sample document",
            },
            success: true,
            message: "Document deleted successfully.",
          },
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
