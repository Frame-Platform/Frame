import { SQSEvent } from "aws-lambda";
import {
  pgInsert,
  pgConnect,
  resizeImageToLimit,
  callTitan,
  downloadImage,
} from "./utils";
import { payloadSchema } from "./types";
import { Client } from "pg";
import { ZodError } from "zod";
let pgClient: null | Client = null;

export const handler = async (event: SQSEvent) => {
  try {
    const message = JSON.parse(event.Records[0].body);
    const validationResult = payloadSchema.parse(message);
    const { url, desc } = validationResult;

    // Fetch the image and create a buffer
    let imageBuffer;
    if (url) {
      imageBuffer = await downloadImage(url);
    }

    // Resize the buffer and convert to base64
    let imagePayload;
    if (imageBuffer) {
      const resizedBuffer = await resizeImageToLimit(imageBuffer);
      imagePayload = { inputImage: resizedBuffer.toString("base64") };
    }

    const textPayload = desc ? { inputText: desc } : {};
    const payload = { ...imagePayload, ...textPayload };

    // Embed the document
    const embedding = await callTitan(payload);

    // Insert document embedding into RDS
    if (!pgClient) {
      pgClient = await pgConnect();
    }

    await pgInsert(embedding, pgClient, url, desc);

    // Send response back
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: "Document was successfully ingested",
        url,
        desc,
        embedding,
      }),
    };
    return response;
  } catch (e) {
    console.log(e);
    if (e instanceof ZodError) {
      const errorMessages = e.errors.map((err) => err.message).join(", ");
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Validation error",
          details: errorMessages,
        }),
      };
    }

    if (e instanceof Error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: e.message }),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to ingest document", e }),
    };
  }
};
