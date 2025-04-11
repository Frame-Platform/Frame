import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ImageValidationError, payloadSchema, TitanInputType } from "./types";
import { ZodError } from "zod";
import { Client } from "pg";
import dotenv from "dotenv";
import {
  downloadImage,
  resizeImageToLimit,
  callTitan,
  pgConnect,
} from "./utils";

dotenv.config();
let pgClient: null | Client = null;

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const validationResult = payloadSchema.parse(event);
    const { url, description, threshold, topK } = validationResult;

    let imagePayload = {};
    if (url) {
      const imageBuffer = await downloadImage(url);
      const resizedBuffer = await resizeImageToLimit(imageBuffer);
      imagePayload = { inputImage: resizedBuffer.toString("base64") };
    }

    const textPayload = description ? { inputText: description } : {};
    const payload: TitanInputType = { ...imagePayload, ...textPayload };

    const { embedding } = await callTitan(payload);

    if (!pgClient) {
      pgClient = await pgConnect();
    }
    const query = `
      SELECT
          id,
          url,
          description,
          metadata,
          timestamp,
          1 - (embedding <=> $1::vector) AS score
      FROM
          documents
      WHERE
          1 - (embedding <=> $1::vector) >= $2
      ORDER BY
          score DESC
      LIMIT $3;
      `;

    const results = await pgClient.query(query, [
      JSON.stringify(embedding),
      threshold,
      topK,
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify(results.rows),
    };
  } catch (e) {
    console.log(e);
    if (e instanceof ZodError) {
      const errorMessages = e.errors.map((err) => err.message).join(", ");
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Zod Validation Error",
          details: errorMessages,
        }),
      };
    }

    if (e instanceof ImageValidationError) {
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
