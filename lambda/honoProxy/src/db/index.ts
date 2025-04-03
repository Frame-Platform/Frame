import { Client } from "pg";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  GetSecretValueCommandOutput,
} from "@aws-sdk/client-secrets-manager";
import {
  DatabaseCredentials,
  DatabaseCredentialsSchema,
} from "../routes/sharedSchemas";
import { z } from "@hono/zod-openapi";

let pgClient: null | Client = null;

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
    if (pgClient) return pgClient;

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

    pgClient = new Client({
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
