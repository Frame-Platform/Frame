import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { Client } from "pg";
import dotenv from "dotenv";
import sharp from "sharp";
import { TitanInputType } from "./types";
const AWS_REGION = "us-east-1";
const EMBEDDING_MODEL = "amazon.titan-embed-image-v1";
dotenv.config();

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

export const pgInsert = async (
  embedding: number[],
  pgClient: Client,
  url?: string,
  desc?: string
): Promise<void> => {
  try {
    await pgClient.query("CREATE EXTENSION IF NOT EXISTS vector");
    await pgClient.query(
      `CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      embedding vector(1024) NOT NULL,
      url TEXT,
      description TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    );
    const query = `
              INSERT INTO documents (embedding, url, description)
              VALUES ($1, $2, $3)
          `;

    // if url or desc is undefined, row will have a NULL value
    await pgClient.query(query, [JSON.stringify(embedding), url, desc]);
  } catch (e) {
    throw new Error(`Error inserting document into database: ${e}`);
  }
};

export const resizeImageToLimit = async (
  imageBuffer: Buffer
): Promise<Buffer> => {
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

export const callTitan = async (payload: TitanInputType) => {
  try {
    const bedrockClient = new BedrockRuntimeClient({ region: AWS_REGION });
    const command = new InvokeModelCommand({
      modelId: EMBEDDING_MODEL,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload),
    });

    const responseBedrock = await bedrockClient.send(command);
    const responseBody = JSON.parse(
      Buffer.from(responseBedrock.body).toString()
    );

    return responseBody.embedding;
  } catch (e) {
    throw new Error(`Error calling Titan, Error: ${e}`);
  }
};

export const downloadImage = async (url: string) => {
  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    throw Error(`Failed downloading image ${url}, Error: ${e}`);
  }

  if (!res.ok) {
    throw new Error(
      `Non 200 response for url ${url}, status:${res.status} ${res.statusText}`
    );
  }
  const contentType = res.headers.get("content-type");
  if (!contentType || !["image/png", "image/jpeg"].includes(contentType)) {
    throw new Error(`Invalid content-type ${contentType} for url ${url}.`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
};
