import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { Client } from "pg";
import dotenv from "dotenv";
import sharp from "sharp";
import {
  TitanInputType,
  DatabaseCredentials,
  DatabaseCredentialsSchema,
} from "./types";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  GetSecretValueCommandOutput,
} from "@aws-sdk/client-secrets-manager";
import { z } from "zod" /*"@hono/zod-openapi"*/;

dotenv.config();

// Function to retrieve and parse database credentials
const getDatabaseCredentials = async (
  secretName: string,
  region: string
): Promise<DatabaseCredentials> => {
  const client = new SecretsManagerClient({
    region: region,
  });

  try {
    const response: GetSecretValueCommandOutput = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
        VersionStage: "AWSCURRENT",
      })
    );

    if (!response.SecretString) {
      throw new Error("Secret value is empty");
    }

    const parsedData = JSON.parse(response.SecretString);
    const credentials = DatabaseCredentialsSchema.parse(parsedData);
    return credentials;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Database credentials validation failed:", error.errors);
      throw new Error("Database credentials format is invalid");
    } else if (error instanceof Error) {
      console.error(`Error retrieving database credentials: ${error.message}`);
    } else {
      console.error(
        "Unknown error occurred while retrieving database credentials"
      );
    }
    throw error;
  }
};

export const pgConnect = async () => {
  try {
    let dbCredentials;

    try {
      const SECRET_NAME =
        process.env.DATABASE_SECRET_ARN || "StorageStack-db-credentials";
      const REGION = process.env.AWS_REGION || "us-east-1";
      dbCredentials = await getDatabaseCredentials(SECRET_NAME, REGION);
    } catch (error) {
      console.error("Failed to retrieve database credentials:", error);
      throw new Error("Could not retrieve database credentials");
    }

    const pgClient = new Client({
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT) || 5432,
      database: process.env.DATABASE_NAME,
      user: dbCredentials.username,
      password: dbCredentials.password,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    await pgClient.connect();
    return pgClient;
  } catch (e) {
    throw new Error(`Error connecting to Postgres`);
  }
};

export const pgInsert = async (
  embedding: number[],
  pgClient: Client,
  url?: string | null,
  description?: string | null,
): Promise<void> => {
  try {
    // this should be removed eventually
    await pgClient.query("CREATE EXTENSION IF NOT EXISTS vector");
    await pgClient.query(`CREATE TABLE IF NOT EXISTS documents (
                                id SERIAL PRIMARY KEY,
                                embedding vector(1024) NOT NULL,
                                url TEXT,
                                description TEXT,
                                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT unique_url_desc UNIQUE (url, description)
                                )`);

    if (await documentExists(pgClient, url, description)) return;

    const query = `
              INSERT INTO documents (embedding, url, description)
              VALUES ($1, $2, $3)
              ON CONFLICT (url, description) DO NOTHING
          `;
    // if url or description is undefined, row will have a NULL value
    await pgClient.query(query, [JSON.stringify(embedding), url, description]);
    await pgClient.query(
      `SELECT setval('documents_id_seq', (SELECT MAX(id) FROM documents));`,
    );
  } catch (e) {
    throw new Error(`Error inserting document into database: ${e}`);
  }
};

const documentExists = async (
  pgClient: Client,
  url?: string | null,
  description?: string | null,
) => {
  const { rows } = await pgClient.query(
    `
      SELECT 1
      FROM documents
      WHERE
        (url = $1 OR ($1 IS NULL AND url IS NULL)) AND
        (description = $2 OR ($2 IS NULL AND description IS NULL))
      LIMIT 1;
    `,
    [url, description],
  );

  return rows.length > 0 ? true : false;
};

export const resizeImageToLimit = async (
  imageBuffer: Buffer,
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
    const bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION,
    });
    const command = new InvokeModelCommand({
      modelId: process.env.BEDROCK_MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload),
    });

    const responseBedrock = await bedrockClient.send(command);
    const responseBody = JSON.parse(
      Buffer.from(responseBedrock.body).toString(),
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
      `Non 200 response for url ${url}, status:${res.status} ${res.statusText}`,
    );
  }
  const contentType = res.headers.get("content-type");
  if (!contentType || !["image/png", "image/jpeg"].includes(contentType)) {
    throw new Error(`Invalid content-type ${contentType} for url ${url}.`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
};
