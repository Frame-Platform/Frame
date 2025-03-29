import { z } from "@hono/zod-openapi";
import { VALID_TYPES, MAX_SIZE } from "../sharedSchemas";

export const idPathSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((data) => data && data >= 0, { message: "Invalid resource ID" }),
});

const baseDocumentSchema = z.object({
  url: z.string().url({ message: "Invalid URL format" }).optional().nullable(),
  desc: z.string().optional().nullable(),
});
export type BaseDocumentType = z.infer<typeof baseDocumentSchema>;

export const createDocumentSchema = z.object({
  images: z.array(
    baseDocumentSchema.refine((data) => data.url || data.desc, {
      message: "At least one of url or desc must be provided.",
    }),
  ),
});

export const documentReturnSchema = baseDocumentSchema.extend({
  id: z.number(),
});

export const paginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1000000)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0)),
});

export const validateImageResultSchema = baseDocumentSchema.extend({
  success: z.boolean(),
  errors: z.string().optional(),
});

export type ValidImageResult = z.infer<typeof validateImageResultSchema>;

export const imageResponseSchema = z.object({
  contentType: z
    .string({
      required_error: "Missing 'Content-Type' header.",
      invalid_type_error: "'Content-Type' must be a string.",
    })
    .refine((val) => VALID_TYPES.includes(val), {
      message: "Invalid file type. Only JPEG and PNG images are allowed.",
    }),
  contentLength: z
    .string({
      required_error: "Missing 'Content-Length' header.",
      invalid_type_error: "'Content-Length' must be a string.",
    })
    .transform((val) => parseInt(val, 10))
    .refine((val) => val <= MAX_SIZE, {
      message: "File size exceeds the limit of 5 MB.",
    }),
});
