import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import sharp from "sharp";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Event body is an "images" object that points to an array containing documents.
  // Each document has a url property and optional desc property.
  let body;
  if (event.body) {
    body = JSON.parse(event.body);
  }
  const document = body.images[0];
  const url = document.url;
  const desc = document.desc;

  try {
    const image = await fetch(url);
    // Resize the image
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const resizedImage = await resizeImageToLimit(imageBuffer);
    // Convert resized image to base64
    const imageBase64 = resizedImage.toString("base64");

    // Embed the image
    const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });
    const command = new InvokeModelCommand({
      modelId: "amazon.titan-embed-image-v1",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        inputText: desc,
        inputImage: imageBase64,
      }),
    });

    const responseBedrock = await bedrockClient.send(command);
    const responseBody = JSON.parse(
      Buffer.from(responseBedrock.body).toString()
    );

    const embedding = responseBody.embedding;

    // TODO: Insert image embedding into RDS

    // Send response back
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: "Document was successfully ingested",
        url,
        desc,
        embedding,
      }),
    };
    return response;
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to ingest document", error }),
    };
  }
};

async function resizeImageToLimit(imageBuffer: Buffer): Promise<Buffer> {
  const MAX_DIMENSION = 2048;
  return await sharp(imageBuffer)
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
    })
    .toBuffer();
}
