import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { payloadSchema, TitanInputType } from "./types";
import { ZodError } from "zod";

import { downloadImage, resizeImageToLimit, callTitan } from "./utils";

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log(event);
    const validationResult = payloadSchema.parse(event);
    const { url, desc, threshold, topK } = validationResult;

    let imagePayload = {};
    if (url) {
      const imageBuffer = await downloadImage(url);
      const resizedBuffer = await resizeImageToLimit(imageBuffer);
      imagePayload = { inputImage: resizedBuffer.toString("base64") };
    }

    // gather titan inputs
    const textPayload = desc ? { inputText: desc } : {};
    const payload: TitanInputType = { ...imagePayload, ...textPayload };

    // call titan model for embeddings
    const res = await callTitan(payload);
    const embedding = res.embedding;

    // query RDS Postgres PGVector
    const rdsResults = {};

    return {
      statusCode: 200,
      body: JSON.stringify(embedding),
    };
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
      body: JSON.stringify({ error: "Unknown Server Error" }),
    };
  }
};
