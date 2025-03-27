import { SQSEvent } from "aws-lambda";
import {
  pgInsert,
  resizeImageToLimit,
  callTitan,
  downloadImage,
} from "./utils";
import { payloadSchema } from "./types";

export const handler = async (event: SQSEvent) => {
  try {
    const validationResult = payloadSchema.parse(event);
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
    pgInsert(embedding, url, desc);

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
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to ingest document", error }),
    };
  }
};
