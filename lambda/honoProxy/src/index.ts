import { handle } from "hono/aws-lambda";
import type { LambdaEvent, LambdaContext } from "hono/aws-lambda";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import {
  createDocumentSchema,
  validateImageResultSchema,
  errorResponseSchema,
  validateImage,
  searchJSONSchema,
  searchMultipartSchema,
  paginationSchema,
} from "./types";
import { sendToSQS } from "./utils";
import { ZodError } from "zod";

const app = new OpenAPIHono();

app.use(cors({ origin: "*" }));

app.openapi(
  createRoute({
    method: "get",
    path: "/document",
    request: {
      query: paginationSchema.openapi({
        example: { page: "1", perPage: "10" },
      }),
      description: "Retrieves a paginated list of documents",
    },
    responses: {
      200: {
        description: "Successful retrieval of documents",
        content: {
          "application/json": {
            schema: z.object({
              documents: z.array(z.object({})),
              page: z.number(),
              perPage: z.number(),
              total: z.number(),
            }),
          },
        },
      },
    },
  }),
  (c) => {
    const { page, perPage } = c.req.valid("query");
    const documents = [
      { id: "1", title: "Document 1", content: "Content for document 1" },
      { id: "2", title: "Document 2", content: "Content for document 2" },
    ];
    return c.json({
      documents,
      page,
      perPage,
      total: documents.length,
    });
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/document/:id",
    request: {
      params: z.object({
        id: z.string().openapi({ param: { name: "id", in: "path" } }),
      }),
      description: "Retrieves a specific document by ID",
    },
    responses: {
      200: {
        description: "Successful retrieval of the document",
        content: {
          "application/json": {
            schema: z.object({}),
          },
        },
      },
    },
  }),
  (c) => {
    const { id } = c.req.valid("param");
    const document = {
      id,
      title: `Document ${id}`,
      content: `Content for document ${id}`,
    };
    return c.json(document);
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/document",
    request: {
      body: {
        content: {
          "application/json": {
            schema: createDocumentSchema,
          },
        },
        description:
          "Receives images via URL and optional descriptions and queues them for embedding.",
      },
    },
    responses: {
      200: {
        description: "Validation results of images.",
        content: {
          "application/json": {
            schema: z.array(validateImageResultSchema),
          },
        },
      },
      400: {
        description: "Bad Request",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    try {
      const { images } = c.req.valid("json");
      const validatedImages = await Promise.all(images.map(validateImage));
      const sqsResults = await Promise.allSettled(
        validatedImages.map(sendToSQS),
      );

      const messageStatuses = sqsResults.map((result, i) => {
        const currImg = validatedImages[i];

        return {
          url: currImg.url,
          desc: currImg.desc,
          success: result.status === "fulfilled" ? true : false,
          errors: "reason" in result ? result.reason : "",
        };
      });

      return c.json(messageStatuses, 200);
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : String(e) }, 400);
    }
  },
);
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9-_\.~]/g, "-") // Replace unsafe characters with hyphen
    .toLowerCase(); // Convert to lowercase for consistency
}

// Middleware for parsing multipart form data before zod validation.
app.use("/search", async (c, next) => {
  if (!c.req.header("Content-Type")?.startsWith("multipart/form-data")) {
    return await next();
  }

  const region = "us-east-1";
  const bucketName = "temp-search-bucket";
  const s3Client = new S3Client({ region });

  let imageKey: string | null = null;

  try {
    const validatedData = searchMultipartSchema.parse(await c.req.parseBody());
    // need to validate if 'desc or image' present
    let imageUrl;
    if ("image" in validatedData && "name" in validatedData.image) {
      const { image } = validatedData;
      imageKey = image.name;

      const uploadCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: imageKey as string,
        Body: Buffer.from(await image.arrayBuffer()),
        ContentType: image.type,
      });
      imageUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${imageKey}`;
      await s3Client.send(uploadCommand);
      console.log(`Uploaded S3 image: ${imageKey}`);
    }

    const requestData = {
      ...(imageUrl ? { url: imageUrl } : {}),
      ...(validatedData.desc ? { desc: validatedData.desc } : {}),
      threshold: validatedData.threshold ?? 0,
      topK: validatedData.topK ?? 10,
    };
    console.log(requestData);
    c.req.addValidatedData("formData" as any, requestData);
    await next();
  } catch (e) {
    console.log(`Error in multipart form middleware: ${e}`);
    // if (e instanceof ZodError) {
    //   const errorMessages = e.errors.map((err) => err.message).join(", ");
    //   return {
    //     statusCode: 400,
    //     body: JSON.stringify({
    //       error: "Validation error",
    //       details: errorMessages,
    //     }),
    //   };
    // }
  } finally {
    if (imageKey) {
      console.log(`Deleting S3 image: ${imageKey}`);
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: imageKey,
      });
      await s3Client.send(deleteCommand);
    }
  }
});

app.openapi(
  createRoute({
    method: "post",
    path: "/search",
    request: {
      body: {
        content: {
          "application/json": {
            schema: searchJSONSchema,
          },
          "multipart/form-data": {
            schema: z.any(),
          },
        },
        description:
          "This route performs a search using a document that can include a URL, a description, or both. The JSON body must have at least one of these fields. It also accepts two optional parameters: threshold (0.0 to 1.0, default 0) and topK (default 10) to fine-tune the search. ",
      },
    },
    responses: {
      200: {
        description: "Successful search results",
        content: {
          "application/json": {
            schema: z.object({
              results: z.array(z.any()),
            }),
          },
        },
      },
      400: {
        description: "Bad Request",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
      500: {
        description: "Server Error",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const contentType = c.req.header("Content-Type") || "";
    // to be env
    const region = "us-east-1";

    try {
      let message;
      if (contentType.startsWith("application/json")) {
        message = c.req.valid("json");
      } else if (contentType.startsWith("multipart/form-data")) {
        message = c.req.valid("formData" as "form");
        console.log(message);
      } else {
        throw new Error("No provided message.");
      }

      const lambdaClient = new LambdaClient({ region });
      const command = new InvokeCommand({
        FunctionName: "searchLambda",
        InvocationType: "RequestResponse",
        Payload: Buffer.from(JSON.stringify(message)),
      });
      const res = await lambdaClient.send(command);
      const payloadString = Buffer.from(res.Payload as Uint8Array).toString(
        "utf8",
      );
      return c.json({ results: JSON.parse(payloadString) }, 200);
    } catch (error) {
      if (error instanceof Error) {
        return c.json({ error: error.message }, 500);
      } else {
        return c.json({ error: "Internal Server Error" }, 500);
      }
    }
  },
);

app.get("/doc", (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Swagger UI</title>
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css">
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
      <script>
        SwaggerUIBundle({
          url: '/openapi.json',
          dom_id: '#swagger-ui'
        });
      </script>
    </body>
    </html>
  `);
});

app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "My API",
  },
});

app.all("*", (c) => {
  return c.text("404 Not Found", 404);
});

export const handler = handle(app);
