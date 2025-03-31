import sharp from "sharp";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { TitanInputType } from "./types";
import { Client } from "pg";
import { ImageValidationError } from "./types";

export const pgConnect = async () => {
  try {
    const pgClient = new Client({
      host: process.env.HOST_NAME,
      port: Number(process.env.PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    await pgClient.connect();
    return pgClient;
  } catch (e) {
    throw new Error(`Error connecting to database: ${e}`);
  }
};

export const callTitan = async (payload: TitanInputType) => {
  try {
    const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });
    const command = new InvokeModelCommand({
      modelId: "amazon.titan-embed-image-v1",
      body: JSON.stringify(payload),
    });
    const responseBedrock = await bedrockClient.send(command);
    return await JSON.parse(Buffer.from(responseBedrock.body).toString());
  } catch (e) {
    throw new Error(`Error calling Titan, Error: ${e}`);
  }
};

export const downloadImage = async (url: string) => {
  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new ImageValidationError(
      `Failed downloading image ${url}, Error: ${e}`,
    );
  }

  if (!res.ok) {
    throw new ImageValidationError(
      `Non 200 response for url ${url}, status:${res.status} ${res.statusText}`,
    );
  }
  const contentType = res.headers.get("content-type");
  if (!contentType || !["image/png", "image/jpeg"].includes(contentType)) {
    throw new ImageValidationError(
      `Invalid content-type ${contentType} for url ${url}.`,
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

export const resizeImageToLimit = async (imageBuffer: Buffer) => {
  const MAX_DIMENSION = 2048;
  try {
    return await sharp(imageBuffer)
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
      })
      .toBuffer();
  } catch (e) {
    throw new Error(`Sharp resizing error: ${e}`);
  }
};
