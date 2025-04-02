import { createRoute } from "@hono/zod-openapi";
import {
  searchJSONSchema,
  searchMultipartSchema,
  searchResultSchema,
} from "./schema";
import {
  apiKeySchema,
  errorResponseSchema,
  VALID_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  zodErrorResponseSchema,
} from "../sharedSchemas";

import { z } from "@hono/zod-openapi";

export const searchRoute = createRoute({
  method: "post",
  path: "/search",
  tags: ["documents"],
  description: "Search for documents using an image or description",
  request: {
    headers: z.object({
      "x-api-key": apiKeySchema,
    }),
    body: {
      content: {
        "application/json": {
          schema: searchJSONSchema.openapi({
            example: {
              url: "https://media.newyorker.com/photos/59095bb86552fa0be682d9d0/master/pass/Monkey-Selfie.jpg",
              description: "An image of a monkey taking a selfie.",
              threshold: 0.75,
              topK: 12,
            },
          }),
        },
        "multipart/form-data": {
          schema: searchMultipartSchema,
        },
      },
      description:
        "Search the database using an image, a description, or both, with optional parameters to fine-tune the results.\n\n" +
        "For JSON requests:\n" +
        "- The request body must include either a `url` pointing to an image, a `description` string, or both.\n" +
        "- If both are provide both will be encoded and compared independently using cosine similarity.\n\n" +
        "- Accepted image types: " +
        VALID_IMAGE_TYPES.join(", ") +
        ".\n" +
        "For multipart/form-data requests:\n" +
        "- You must provide either an uploaded image file (`image`) or a `description` or both.\n" +
        "- Accepted image types: " +
        VALID_IMAGE_TYPES.join(", ") +
        ".\n" +
        "- Image URLs and uploaded files must be smaller than " +
        (MAX_IMAGE_SIZE / (1024 * 1024)).toFixed(2) +
        " MB.\n\n" +
        "Optional parameters:\n" +
        "- `threshold` (number between 0.0 and 1.0, default: 0): Filters out results below this cosine similarity threshold.\n" +
        "- `topK` (default: 10): Limits the number of top results returned.",
    },
  },
  responses: {
    200: {
      description: "Successful search results",
      content: {
        "application/json": {
          schema: z.object({
            hits: searchResultSchema,
            count: z.number(),
          }),
          example: {
            hits: [
              {
                id: 171,
                url: "https://media.newyorker.com/photos/59095bb86552fa0be682d9d0/master/pass/Monkey-Selfie.jpg",
                description: "A monkey taking a selfie.",
                timestamp: "2025-03-31T16:30:41.484Z",
                score: 0.6692581354088997,
              },
            ],
            count: 1,
          },
        },
      },
    },
    400: {
      description: "Bad Request",
      content: {
        "application/json": {
          schema: z.union([errorResponseSchema, zodErrorResponseSchema]),
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
