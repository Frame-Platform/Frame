import z from "zod";

export const payloadSchema = z
  .object({
    url: z.string().url().optional(),
    desc: z.string().optional(),
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
