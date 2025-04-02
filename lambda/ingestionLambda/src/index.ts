import { SQSEvent } from "aws-lambda";
import {
  pgInsert,
  resizeImageToLimit,
  callTitan,
  downloadImage,
} from "./utils";
import { payloadSchema } from "./types";
import dotenv from "dotenv";
import { ZodError } from "zod";

export const handler = async (event: SQSEvent) => {
  dotenv.config();
  try {
    const message = JSON.parse(event.Records[0].body);
    const document = payloadSchema.parse(message);
    const { url, description } = document;

    let imagePayload = {};
    if (url) {
      const imageBuffer = await downloadImage(url);
      const resizedBuffer = await resizeImageToLimit(imageBuffer);
      imagePayload = { inputImage: resizedBuffer.toString("base64") };
    }

    const textPayload = description ? { inputText: description } : {};
    const payload = { ...imagePayload, ...textPayload };

    const embedding = await callTitan(payload);
    await pgInsert(embedding, document);

    return { stausCode: 200 };
  } catch (e) {
    console.log(e);
    if (e instanceof ZodError || e instanceof Error) {
      return { statusCode: 400 };
    }

    return { statusCode: 500 };
  }
};
