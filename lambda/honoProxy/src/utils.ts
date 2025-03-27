import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { Client } from "pg";
import dotenv from "dotenv";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
const QUEUE_URL =
  "https://sqs.us-east-1.amazonaws.com/982227461113/ingestionQueue";
const REGION = "us-east-1";
const sqsClient = new SQSClient({ region: REGION });

dotenv.config();

const pgConnect = async () => {
  try {
    const pgClient = new Client({
      host: process.env.HOST_NAME,
      port: Number(process.env.PORT) || 5432,
      database: process.env.DBNAME,
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
  limit: string | number = 'ALL',
  offset: string | number = 0,
) => {
  try {
    const pgClient = await pgConnect();

    const query = `
            SELECT id, url, description FROM documents
            ORDER BY id DESC LIMIT $1 OFFSET $2
    `;
    const { rows } = await pgClient.query(query, [limit, offset]);

    await pgClient.end();
    return rows;
  } catch (e) {
    throw new Error(`Error getting documents`);
  }
}

export async function sendToSQS(image: {
  success: boolean;
  errors?: string;
  url: string;
  desc?: string;
}) {
  // Reject the promise if an individual image/document fails validation instead of throwing an error to allow the rest of the messages to process
  if (!image.success) {
    return Promise.reject(image.errors);
  }
  const messageBody = JSON.stringify({
    url: image.url,
    desc: image.desc || null,
    timestamp: new Date().toISOString(),
  });

  const command = new SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageBody: messageBody,
  });

  return sqsClient.send(command);
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
      "utf8",
    );
    return JSON.parse(payloadString);
  } catch (e) {
    throw new Error(`Error executing search ${e}`);
  }
};
