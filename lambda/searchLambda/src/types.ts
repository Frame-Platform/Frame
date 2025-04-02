import z from "zod";

export const payloadSchema = z
  .object({
    url: z.string().url().optional(),
    description: z.string().optional(),
    threshold: z.number().default(0),
    topK: z.number().default(10),
  })
  .refine((data) => data.url || data.description, {
    message: "Either url or description must be provided",
    path: ["url", "description"],
  });

const titanInputSchema = z.object({
  inputImage: z.string().optional(),
  inputText: z.string().optional(),
});

export type TitanInputType = z.infer<typeof titanInputSchema>;

export class ImageValidationError extends Error {}

export const DatabaseCredentialsSchema = z.object({
  password: z.string(),
  /*
  dbname: z.string(),
  engine: z.string(),
  port: z.number(),
  dbInstanceIdentifier: z.string(),
  host: z.string(),
  */
  username: z.string(),
});

export type DatabaseCredentials = z.infer<typeof DatabaseCredentialsSchema>;
