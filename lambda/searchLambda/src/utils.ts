import sharp from "sharp";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  TitanInputType,
  DatabaseCredentials,
  DatabaseCredentialsSchema,
} from "./types";
import { Client } from "pg";
import { ImageValidationError } from "./types";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  GetSecretValueCommandOutput,
} from "@aws-sdk/client-secrets-manager";
import { z } from "zod" /*"@hono/zod-openapi"*/;

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

/*
let pgClient: null | Client = null;

export const pgConnect = async () => {
  try {
    if (pgClient) return pgClient;

    pgClient = new Client({
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
*/

export const callTitan = async (payload: TitanInputType) => {
  try {
    const bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION,
    });
    const command = new InvokeModelCommand({
      modelId: process.env.BEDROCK_MODEL_ID,
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
      `Failed downloading image ${url}, Error: ${e}`
    );
  }

  if (!res.ok) {
    throw new ImageValidationError(
      `Non 200 response for url ${url}, status:${res.status} ${res.statusText}`
    );
  }
  const contentType = res.headers.get("content-type");
  if (!contentType || !["image/png", "image/jpeg"].includes(contentType)) {
    throw new ImageValidationError(
      `Invalid content-type ${contentType} for url ${url}.`
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
