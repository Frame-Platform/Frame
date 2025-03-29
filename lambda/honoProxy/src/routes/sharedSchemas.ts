import { z } from "@hono/zod-openapi";

export const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
export const VALID_TYPES = ["image/jpeg", "image/png"];

export const errorResponseSchema = z.object({
  error: z.string(),
});
