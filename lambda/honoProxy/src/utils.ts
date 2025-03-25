import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
const QUEUE_URL =
  "https://sqs.us-east-1.amazonaws.com/982227461113/ingestionQueue";
const REGION = "us-east-1";
const sqsClient = new SQSClient({ region: REGION });

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

export const imgToBase64 = async (image: File) => {
  const bufferArray = await image.arrayBuffer();
  const imgBuffer = Buffer.from(bufferArray);
  return imgBuffer.toString("base64");
};