# Document Embedding Pipeline - Compute Stack

The Compute Stack component of the Document Embedding Pipeline contains the Lambda functions that power the document embedding and search capabilities.

## Overview

The Compute Stack creates the following AWS resources:

- API Lambda (built with Hono.js) for handling HTTP requests
- Image Ingestion Lambda for processing documents from the SQS queue
- Search Lambda for performing similarity searches
- IAM roles with the necessary permissions

## Lambda Functions

### API Lambda (Hono)

This Lambda function acts as the entry point for all HTTP requests and routes them appropriately:

- **GET /document**: Retrieves a paginated list of documents from the RDS
- **GET /document/:id**: Retrieves a specific document by ID from the RDS
- **POST /document**: Validates image URLs and sends them to SQS for asynchronous processing
- **POST /search**: Forwards similarity search requests to the Search Lambda
- **DELETE /document/:id**: Deletes images from the RDS database (to remove the associated embedding)

Configuration:

- Memory: 1024MB
- Timeout: 30 seconds
- Permissions:
  - SQS message sending (for Image Ingestion SQS)
  - Lambda invocation (for direct invocations of Search Lambda)
  - Get Secret Value from Secrets Manager (for database access)
  - Put object, get object and delete object from S3 bucket

### Image Ingestion Lambda

This Lambda function processes documents asynchronously:

- Triggered by messages in the SQS queue
- Performs pre-processing, embedding generation, and database storage
- Handles batch processing of multiple documents

Configuration:

- Memory: 1024MB
- Timeout: 15 minutes (maximum time)
- SQS Message Batch Size: 1 message
- Triggers:
  - SQS trigger for batch processing
- Permissions:
  - Bedrock model invocation
  - Get Secret Value from Secrets Manager (for database access)

### Search Lambda

This Lambda function handles search requests:

- Performs pre-processing of search queries
- Generates embeddings for text or image queries
- Executes vector similarity search in the database
- Returns ranked search results

Configuration:

- Memory: 1024MB
- Timeout: 30 seconds
- Triggers:
  - API Lambda (Hono)
- Permissions:
  - Bedrock model invocation
  - Get Secret Value from Secrets Manager (for database access)

## Environment Variables

Each Lambda function uses specific environment variables:

| Variable            | Description                                           | Used by                         |
| ------------------- | ----------------------------------------------------- | ------------------------------- |
| DOCUMENT_QUEUE_URL  | URL of the SQS queue for document processing          | API Lambda                      |
| DATABASE_SECRET_ARN | ARN of the Secrets Manager secret with DB credentials | All Lambdas                     |
| DATABASE_HOST       | Hostname of the RDS database                          | All Lambdas                     |
| DATABASE_PORT       | Port of the RDS database                              | All Lambdas                     |
| SEARCH_LAMBDA_ARN   | ARN of the Search Lambda                              | API Lambda                      |
| IMAGE_BUCKET_NAME   | Name of the S3 bucket                                 | API Lambda                      |
| BEDROCK_MODEL_ID    | ID of the embedding model                             | Image Ingestion, Search Lambdas |

## IAM Permissions

The stack creates IAM roles with the following permissions:

- **API Lambda**: Basic Lambda execution, SQS message sending, Lambda invocation (Direct invocation of Search Lambda), database access, S3 bucket access
- **Image Ingestion Lambda**: Basic Lambda execution, Bedrock model invocation, database access
- **Search Lambda**: Basic Lambda execution, Bedrock model invocation, database access

## Integration with Other Stacks

This stack depends on:

- **Messaging Stack**: Uses the SQS queue for asynchronous document processing
- **Storage Stack**: Uses the RDS database for storing and querying embeddings and the S3 bucket for temporary image storage during processing
