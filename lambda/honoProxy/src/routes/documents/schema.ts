import { z } from "@hono/zod-openapi";
import { baseDocumentSchema } from "../sharedSchemas";
import {
  VALID_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  DEFAULT_PAGINATION_LIMIT,
  MAX_PAGINATION_LIMIT,
} from "../sharedSchemas";

export const idPathSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((data) => data && data >= 0, { message: "Invalid resource ID" }),
});

export const documentSchema = baseDocumentSchema.refine(
  (data) => data.url || data.description,
  {
    message: "At least one of url or description must be provided.",
  }
);

export const documentReturnSchema = baseDocumentSchema.extend({
  id: z.number(),
});

export const paginationSchema = z.object({
  limit: z.coerce
    .number()
    .min(1, { message: "Limit must be at least 1." })
    .max(MAX_PAGINATION_LIMIT, {
      message: `Limit must not exceed ${MAX_PAGINATION_LIMIT}`,
    })
    .default(DEFAULT_PAGINATION_LIMIT)
    .describe(
      `Number of items to return (max ${MAX_PAGINATION_LIMIT}, default ${DEFAULT_PAGINATION_LIMIT})`
    ),
  offset: z.coerce
    .number()
    .min(0, { message: "Offset must be 0 or greater." })
    .default(0)
    .describe(
      "Number of items to skip before starting to collect the result set (default 0)"
    ),
});

export const validateDocResultSchema = baseDocumentSchema.extend({
  success: z.boolean(),
  errors: z.string().optional(),
});

export type ValidDocResult = z.infer<typeof validateDocResultSchema>;

export const imageResponseSchema = z.object({
  contentType: z.string().refine((val) => VALID_IMAGE_TYPES.includes(val), {
    message: "Invalid file type. Only JPEG and PNG images are allowed.",
  }),
  contentLength: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val < MAX_IMAGE_SIZE, {
      message: "File size exceeds the limit of 5 MB.",
    }),
});

export const recommendRequestSchema = z.object({
  threshold: z.coerce
    .number()
    .min(0, "Threshold must be at least 0")
    .max(1, "Threshold must be at most 1")
    .default(0)
    .openapi({
      description:
        "Cosine similarity threshold (between 0 and 1). Results with a similarity below this value will be excluded.",
    }),
  topK: z.coerce
    .number()
    .max(MAX_PAGINATION_LIMIT, {
      message: `topK must not exceed ${MAX_PAGINATION_LIMIT}`,
    })
    .default(10)
    .openapi({
      description: `The maximum number of top results to return. Must not exceed ${MAX_PAGINATION_LIMIT}.`,
    }),
});

export const recommendResultSchema = baseDocumentSchema.extend({
  id: z.number(),
  timestamp: z.string(),
  score: z.number(),
});
