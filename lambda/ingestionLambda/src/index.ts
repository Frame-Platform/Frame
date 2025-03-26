import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { SQSEvent } from "aws-lambda";
import sharp from "sharp";
import { Client } from "pg";

export const handler = async (event: SQSEvent) => {
  console.log("Received SQS event:", JSON.stringify(event, null, 2));
  // Event body is an "images" object that points to an array containing documents.
  // Each document has a url property and optional desc property.

  const record = event.Records[0];
  const { body } = record;
  const messageBody = JSON.parse(body);
  const { url, desc, timestamp } = messageBody;

  console.log("Image URL:", url);
  console.log("Description:", desc);
  console.log("Timestamp:", timestamp);
  // Check to see if document UUID exists in DB, if true, return early to maintain idempotency

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
    console.log("Embedding:", embedding);
    // TODO: Insert image embedding into RDS
    const pgClient = new Client({
      host: "nys-vector-database.c29e26essd79.us-east-1.rds.amazonaws.com",
      port: 5432,
      database: "postgres",
      user: "postgres",
      password: "Yw7vmmGNBC1qCVdY7C3b",
      ssl: {
        rejectUnauthorized: false,
      },
    });
    await pgClient.connect();
    await pgClient.query("CREATE EXTENSION IF NOT EXISTS vector");
    await pgClient.query(
      "CREATE TABLE IF NOT EXISTS documents (id SERIAL PRIMARY KEY, embedding vector(1024), url TEXT, description TEXT)"
    );
    const query = `
            INSERT INTO documents (embedding, url, description)
            VALUES ($1, $2, $3)
        `;

    await pgClient.query(query, [JSON.stringify(embedding), url, desc]);
    console.log("Data inserted successfully");
    const queryResult = await pgClient.query("SELECT * FROM documents");
    console.log("Query result:", queryResult.rows);
    await pgClient.end();
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
