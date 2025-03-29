import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

export const deleteImageFromS3 = async (key: string) => {
  const bucketName = "temp-search-bucket";
  const s3Client = new S3Client({ region: process.env.AWS_REGION });

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
  const region = process.env.AWS_REGION;
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
  try {
    const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });
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
