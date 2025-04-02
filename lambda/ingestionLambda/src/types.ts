import z from "zod";

export const payloadSchema = z
  .object({
    url: z.string().url().optional().nullable(),
    description: z.string().optional().nullable(),
    metadata: z.record(z.any()).optional().nullable(),
  })
  .refine((data) => data.url || data.description, {
    message: "Either url or description must be provided.",
    path: ["url", "description"],
  });
export type DocPayloadType = z.infer<typeof payloadSchema>;

const titanInputSchema = z.object({
  inputImage: z.string().optional(),
  inputText: z.string().optional(),
});

export type TitanInputType = z.infer<typeof titanInputSchema>;

export const DatabaseCredentialsSchema = z.object({
  password: z.string(),
  username: z.string(),
});

export type DatabaseCredentials = z.infer<typeof DatabaseCredentialsSchema>;
