# Document Embedding Pipeline - API Stack

The API Stack component of the Document Embedding Pipeline creates the API Gateway for accessing the document embedding and search capabilities.

## What This Creates

The API Stack sets up the interface that lets your applications access the document embedding and search capabilities:

- API Gateway: The main entry point for all requests
- API Key: Your authentication credential (required for all requests)
- Lambda Integration: Connects API requests to processing functions

## API Gateway Details

| Setting        | Configuration | What This Means                                     |
| -------------- | ------------- | --------------------------------------------------- |
| Stage          | `prod`        | Your API endpoint will include `/prod/` in the URL  |
| CORS           | Enabled       | Web applications can access the API from any domain |
| Authentication | API Key       | All requests must include your API key to work      |

## Using Your API Key

After deployment, you will be provided with your API Key ID but will need its associated API Key to make requests. Here's how to get it:

### Option 1: From the AWS Console

- Go to API Gateway in the AWS Console
- Select "API Keys" from the left sidebar
- Find the key with the correct ID and click on the "Copy" icon to copy the key.

### Option 2: Using the AWS CLI

Once deployment is complete, you will receive your API Key ID. Run the below commandS with your specific API Key ID in place of `$API_KEY_ID`:

```console
API_KEY=$(aws apigateway get-api-key --api-key $API_KEY_ID --include-value --query "value" --output text)

echo "Your API Key: $API_KEY"
```

## Making API Requests

Always include your API key in the `x-api-key` header:

```console
# Example using curl
curl -X POST "https://your-api-id.execute-api.region.amazonaws.com/prod/document" \
     -H "x-api-key: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://example.com/image.jpg"}'
```

Or using the provided client SDK (recommended):

```javascript
const client = new DocumentEmbeddingClient({
  apiKey: "YOUR_API_KEY",
  endpoint: "https://your-api-id.execute-api.region.amazonaws.com/prod",
});

// The SDK automatically includes your API key in all requests
const result = await client.createEmbedding({
  url: "https://example.com/image.jpg",
});
```

## API Endpoints

| Endpoint        | Method | Description                                                       |
| --------------- | ------ | ----------------------------------------------------------------- |
| `/document`     | POST   | Create an embedding for a new image or multiple images (in batch) |
| `/document`     | GET    | Get all documents and embeddings                                  |
| `/document/:id` | GET    | Get a specific document / embedding by ID                         |
| `/document/:id` | DELETE | Delete an embedding                                               |
| `/search`       | POST   | Search similar embeddings using text or an image                  |
