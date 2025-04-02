# Document Embedding Pipeline - Compute Stack

## What This Creates

The Compute Stack provides the processing power behind the Document Embedding Pipeline through three specialized Lambda functions:

- API Lambda: Handles all incoming requests and routes them to appropriate services
- Image Ingestion Lambda: Processes images to generate embeddings asynchronously
- Search Lambda: Performs similarity searches across your image embeddings

## Lambda Functions In Detail

### API Lambda (Hono)

This serves as the main entry point for all requests to your system.

**What it does:**

- Routes HTTP requests to the appropriate service
- Validates incoming data
- Communicates with the database, SQS and other Lambda functions

| Endpoint        | Method | Purpose                                             |
| :-------------- | :----- | :-------------------------------------------------- |
| `/document`     | GET    | Retrieve a paginated list of documents              |
| `/document/:id` | GET    | Retrieve a specific document by ID                  |
| `/document`     | POST   | Process new image URLs and queue them for embedding |
| `/search`       | POST   | Forward search requests to the Search Lambda        |
| `/document/:id` | DELETE | Remove documents and their embeddings               |

**Technical Details:**

- Memory: 1769MB
- Timeout: 30 seconds
- AWS Permissions:
  - SQS full access (to send messages to processing queue)
  - S3 full access (to manage uploaded images)
  - Lambda invocation (to call Search Lambda)
  - Secrets Manager access (for database credentials)

### Image Ingestion Lambda

This processes your images behind the scenes to generate AI embeddings.

**What it does:**

- Listens for new messages in the SQS queue
- Downloads and processes images
- Generates embeddings using Amazon Bedrock
- Stores results in the PostgreSQL database

**Technical Details:**

- Memory: 1769MB
- Timeout: 30 seconds
- Processes one image at a time (batch size: 1)
- AWS Permissions:
  - Bedrock model access (to generate embeddings)
  - Secrets Manager access (for database credentials)

### Search Lambda

This handles all similarity searches across your embeddings.

**What it does:**

- Processes search queries (text or images)
- Generates embeddings for the search input
- Finds similar images using vector similarity search
- Returns ranked results

**Technical Details:**

- Memory: 1769MB
- Timeout: 30 seconds
- AWS Permissions:
  - Bedrock model access (for search query embedding)
  - Secrets Manager access (for database credentials)

## Environment Variables

Each Lambda function is configured using specific environment variables:

| Variable              | Description                                           | Used by                         |
| --------------------- | ----------------------------------------------------- | ------------------------------- |
| `DOCUMENT_QUEUE_URL`  | URL of the SQS queue for document processing          | API Lambda                      |
| `DATABASE_SECRET_ARN` | ARN of the Secrets Manager secret with DB credentials | All Lambdas                     |
| `DATABASE_HOST`       | Hostname of the RDS database                          | All Lambdas                     |
| `DATABASE_PORT`       | Port of the RDS database                              | All Lambdas                     |
| `SEARCH_LAMBDA_ARN`   | ARN of the Search Lambda                              | API Lambda                      |
| `IMAGE_BUCKET_NAME`   | Name of the S3 bucket                                 | API Lambda                      |
| `BEDROCK_MODEL_ID`    | ID of the embedding model                             | Image Ingestion, Search Lambdas |
| `DATABASE_NAME`       | Name of the database                                  | All Lambdas                     |

## System Architecture

The Compute Stack integrates with other components:

- Messaging Stack: Uses SQS queues for reliable asynchronous processing
- Storage Stack: Uses PostgreSQL for vector search and S3 for image storage
