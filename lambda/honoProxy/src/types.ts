import { z } from "@hono/zod-openapi";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const VALID_TYPES = ["image/jpeg", "image/png"];

const documentEntrySchema = z
  .object({
    url: z
      .string()
      .url({ message: "Invalid URL format" })
      .optional()
      .nullable(),
    desc: z.string().optional().nullable(),
  })
  .refine((data) => data.url || data.desc, {
    message: "At least one of url or desc must be provided.",
  });

export const createDocumentSchema = z.object({
  images: z.array(documentEntrySchema).openapi({
    example: [
      {
        url: "https://example.com/image.png",
        desc: "Optional description",
      },
    ],
  }),
});

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

export const validateImageResultSchema = z.object({
  success: z.boolean(),
  url: z.string().optional().nullable(),
  desc: z.string().optional().nullable(),
  errors: z.string().optional(),
});

export const errorResponseSchema = z.object({
  error: z.string(),
});

type DocumentEntryType = z.infer<typeof documentEntrySchema>;
export type ValidImageResult = z.infer<typeof validateImageResultSchema>;

export const validateImage = async ({
  url,
  desc,
}: DocumentEntryType): Promise<ValidImageResult> => {
  try {
    if (!url) return { success: true, url, desc, errors: "" };

    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) {
      return {
        success: false,
        url,
        desc,
        errors: `Fetch error: Received ${res.status} status.`,
      };
    }

    const contentType = res.headers.get("content-type");
    const contentLength = res.headers.get("content-length");

    const parsed = imageResponseSchema.safeParse({
      contentType,
      contentLength,
    });

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(", ");
      return { success: false, url, desc, errors };
    }

    return { success: true, url, desc };
  } catch (e: unknown) {
    const errorMessage =
      e instanceof Error
        ? e.message
        : "Unknown error occurred during validation.";
    return { success: false, url, desc, errors: errorMessage };
  }
};

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

export const deleteSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((data) => data && data > 0, { message: "Invalid ID" }),
});
