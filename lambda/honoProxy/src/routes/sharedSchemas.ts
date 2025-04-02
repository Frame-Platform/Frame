import { z } from "@hono/zod-openapi";

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const VALID_IMAGE_TYPES = ["image/jpeg", "image/png"];
export const DEFAULT_PAGINATION_LIMIT = 20;
export const MAX_PAGINATION_LIMIT = 100;

export const errorResponseSchema = z.object({
  error: z.string(),
});

export const baseDocumentSchema = z.object({
  url: z.string().url({ message: "Invalid URL format" }).optional().nullable(),
  description: z.string().optional().nullable(),
  metadata: z.record(z.any()).optional(),
});
export type BaseDocumentType = z.infer<typeof baseDocumentSchema>;

export const apiKeySchema = z.string().openapi({
  description: "API key for authentication",
  param: {
    name: "x-api-key",
    in: "header",
    required: true,
    schema: {
      type: "string",
    },
  },
});

export const DatabaseCredentialsSchema = z.object({
  password: z.string(),
  username: z.string(),
});

export type DatabaseCredentials = z.infer<typeof DatabaseCredentialsSchema>;

const zodIssueSchema = z.object({
  code: z.string(),
  expected: z.any().optional(),
  received: z.any().optional(),
  path: z.array(z.union([z.string(), z.number()])),
  message: z.string(),
});

export const zodErrorResponseSchema = z.object({
  name: z.literal("ZodError"),
  issues: z.array(zodIssueSchema),
});
