import { SQSClient, SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { Client } from "pg";
import dotenv from "dotenv";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { ValidImageResult } from "./types";
const QUEUE_URL =
  "https://sqs.us-east-1.amazonaws.com/982227461113/ingestionQueue";
dotenv.config();
let pgClient: null | Client = null;

const pgConnect = async () => {
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
    throw new Error(`Error connecting to Postgres`);
  }
};

export const pgGetDocuments = async (
  limit: number, // default limit is 1mil, default offset is 0 => returns all
  offset: number
) => {
  try {
    if (!pgClient) {
      pgClient = await pgConnect();
    }

    const query = `
            SELECT id, url, description FROM documents
            ORDER BY id DESC LIMIT $1 OFFSET $2
    `;
    const { rows } = await pgClient.query(query, [limit, offset]);
    return rows;
  } catch (e) {
    throw new Error(`Error getting documents: ${e}`);
  }
};

export const pgGetById = async (
  id: string | number
) => {
  try {
    const pgClient = await pgConnect();

    const query = `
             SELECT id, url, description FROM documents WHERE id = $1
    `;

    const { rows } = await pgClient.query(query, [id]);

    await pgClient.end();
    return rows;
  } catch (e) {
    throw new Error(`Error getting document by id`);
  }
}

export const pgDeleteDocument = async (id: number) => {
  try {
    if (!pgClient) {
      pgClient = await pgConnect();
    }
    const query = `
      DELETE FROM documents WHERE id = $1 RETURNING *;
    `;
    const result = await pgClient.query(query, [id]);
    if (result.rowCount === 0) {
      return { success: false, message: `No document found with ID ${id}` };
    }

    return {
      success: true,
      message: `Document with ID ${id} deleted successfully.`,
    };
  } catch (e) {
    throw new Error(`Failed to delete document: ${e}`);
  }
};

export async function sendToSQS(
  images: ValidImageResult[],
  sqsClient: SQSClient
) {
  // Filter out invalid images to avoid sending bad requests
  const validImages = images.filter((image) => image.success);

  if (validImages.length === 0) {
    return { Failed: [], Successful: [] };
  }

  const entries = validImages.map((image, index) => ({
    Id: index.toString(), // Unique identifier per batch message
    MessageBody: JSON.stringify({
      url: image.url,
      desc: image.desc || null,
      timestamp: new Date().toISOString(),
    }),
  }));

  const command = new SendMessageBatchCommand({
    QueueUrl: QUEUE_URL,
    Entries: entries,
  });

  try {
    const response = await sqsClient.send(command);
    return response; // Contains Successful and Failed fields
  } catch (error) {
    console.error("Error sending batch to SQS:", error);
    throw error;
  }
}

export const deleteImageFromS3 = async (key: string) => {
  const region = "us-east-1";
  const bucketName = "temp-search-bucket";
  const s3Client = new S3Client({ region });

  console.log(`Deleting S3 image: ${key}`);
  try {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await s3Client.send(deleteCommand);
  } catch (e) {
    console.log(`Erorr Deleting ${key}: ${e}`);
  }
};

export const uploadImageToS3 = async (image: File) => {
  const key = image.name.trim();
  const region = "us-east-1";
  const bucketName = "temp-search-bucket";
  try {
    const s3Client = new S3Client({ region });

    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: Buffer.from(await image.arrayBuffer()),
      ContentType: image.type,
    });

    await s3Client.send(uploadCommand);
    console.log(`Uploaded S3 image: ${key}`);
    return {
      url: `https://${bucketName}.s3.${region}.amazonaws.com/${key}`,
      key,
    };
  } catch (e) {
    console.log(`Error Uploading ${key}, ${e}`);
    throw e;
  }
};

export const invokeSearchLambda = async (message: {
  threshold: number;
  topK: number;
  url?: string;
  desc?: string;
}) => {
  const region = "us-east-1";
  try {
    const lambdaClient = new LambdaClient({ region });
    const command = new InvokeCommand({
      FunctionName: "searchLambda",
      InvocationType: "RequestResponse",
      Payload: Buffer.from(JSON.stringify(message)),
    });
    const res = await lambdaClient.send(command);
    const payloadString = Buffer.from(res.Payload as Uint8Array).toString(
      "utf8"
    );
    return JSON.parse(payloadString);
  } catch (e) {
    throw new Error(`Error executing search ${e}`);
  }
};
