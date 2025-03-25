import z from "zod";

export const payloadSchema = z
  .object({
    url: z.string().url().optional(),
    base64EncodedImage: z.string().optional(),
    desc: z.string().optional(),
    threshold: z.number().default(0),
    topK: z.number().default(10),
  })
  .refine((data) => data.base64EncodedImage || data.url || data.desc, {
    message: "Either url, base64encodedImage or desc must be provided",
    path: ["base64EncodedImage", "url", "desc"],
  });

const titanInputSchema = z.object({
  inputImage: z.string().optional(),
  inputText: z.string().optional(),
});

export type TitanInputType = z.infer<typeof titanInputSchema>;
