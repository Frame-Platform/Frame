// import z from "zod"   ???

export interface Document {
  url: string,
  desc?: string,
}

export interface Documents {
  documents: Document[]
}

export interface GetDocsParameterSchema {
  limit: string,
  offset: string,
}

export interface GetDocsReturnSchema {
  documents: Documents,
  limit: number,
  offset: number,
  total: number,
}

export interface GetDocsErrorSchema {
  error: string,
}

export interface ImagesSchema {

}


/*

export const getDocsSchema = z.object({
  limit: z.string(),
  offset: z.string(),
})


 */
/*

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

*/
