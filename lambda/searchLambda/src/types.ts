import z from "zod";

export const payloadSchema = z
  .object({
    url: z.string().url().optional(),
    desc: z.string().optional(),
    threshold: z.number().default(0),
    topK: z.number().default(10),
  })
  .refine((data) => data.url || data.desc, {
    message: "Either url or desc must be provided",
    path: ["url", "desc"],
  });

const titanInputSchema = z.object({
  inputImage: z.string().optional(),
  inputText: z.string().optional(),
});

export type TitanInputType = z.infer<typeof titanInputSchema>;

export class ImageValidationError extends Error {}

export const DatabaseCredentialsSchema = z.object({
  password: z.string(),
  dbname: z.string(),
  engine: z.string(),
  port: z.number(),
  dbInstanceIdentifier: z.string(),
  host: z.string(),
  username: z.string(),
});

export type DatabaseCredentials = z.infer<typeof DatabaseCredentialsSchema>;
