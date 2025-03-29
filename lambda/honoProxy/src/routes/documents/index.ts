import { createRoute } from "@hono/zod-openapi";
import { errorResponseSchema } from "../sharedSchemas";
import { paginationSchema } from "./schema";
import { z } from "@hono/zod-openapi";

export const getDocumentsRoute = createRoute({
  method: "get",
  path: "/document",
  request: {
    query: paginationSchema.openapi({
      example: { limit: "1", offset: "10" },
    }),
    description: "Retrieves a paginated list of documents",
  },
  responses: {
    200: {
      description: "Successful retrieval of documents",
      content: {
        "application/json": {
          schema: z.object({
            documents: z.array(z.object({})),
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
