import { z } from "@hono/zod-openapi";
import {
  MAX_IMAGE_SIZE,
  VALID_IMAGE_TYPES,
  MAX_PAGINATION_LIMIT,
} from "../sharedSchemas";
import { baseDocumentSchema } from "../sharedSchemas";

const searchSchema = z.object({
  threshold: z
    .number()
    .min(0, "Threshold must be at least 0")
    .max(1, "Threshold must be at most 1")
    .default(0),
  topK: z
    .number()
    .max(MAX_PAGINATION_LIMIT, {
      message: `topK must not exceed ${MAX_PAGINATION_LIMIT}`,
    })
    .default(10),
});

export const searchJSONSchema = baseDocumentSchema
  .extend({ ...searchSchema.shape })
  .refine((data) => data.url || data.desc, {
    message: "At least one of url or desc must be provided.",
  });

export const searchMultipartSchema = z
  .object({
    image: z.preprocess(
      (file) => {
        if (file instanceof File && file.size === 0 && file.name === "") {
          return undefined;
        }
        return file;
      },
      z
        .any()
        .optional()
        .refine(
          (file) => {
            if (!file) return true;
            return VALID_IMAGE_TYPES.includes(file.type);
          },
          {
            message: "Invalid image type. Only JPEG and PNG are allowed",
          },
        )
        .refine(
          (file) => {
            if (!file) return true;
            return file.size > 0 && file.size <= MAX_IMAGE_SIZE;
          },
          {
            message: `File size must be between 0 and ${
              MAX_IMAGE_SIZE / 1024 / 1024
            } MB`,
          },
        ),
    ),
    desc: z.string().optional(),
  })
  .extend({ ...searchSchema.shape })
  .refine((data) => data.image || data.desc, {
    message: "At least one of image or desc must be provided.",
  });

export type SearchMulitpartType = z.infer<typeof searchMultipartSchema>;
export type SearchJSONType = z.infer<typeof searchJSONSchema>;

export const searchResultSchema = baseDocumentSchema.extend({
  id: z.number(),
  timestamp: z.string(),
  score: z.number(),
});
