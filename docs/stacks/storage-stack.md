# Document Embedding Pipeline - Storage Stack

## What This Creates

The Storage Stack sets up all data storage components needed for the Document Embedding Pipeline:

- PostgreSQL Database: Stores image embeddings and metadata
- S3 Bucket: Stores uploaded image files
- VPC Network: Provides network infrastructure
- Security Group: Controls access to the database
- Secrets Manager: Securely stores database credentials

## Database Configuration

| Setting          | Value                     | Notes                                   |
| :--------------- | :------------------------ | :-------------------------------------- |
| Database Type    | PostgreSQL 17             | Vector search capabilities enabled      |
| Instance Size    | t4g.small                 | $24/month, suitable for light workloads |
| Storage          | Auto-scaling up to 1000GB | Grows as needed                         |
| Vector Extension | pgvector                  | Enabled via initialization script       |

## S3 Bucket Configuration

| Setting       | Value                 | Notes                           |
| :------------ | :-------------------- | :------------------------------ |
| Public Access | Enabled               | Images can be accessed directly |
| Versioning    | Disabled              | Only latest version stored      |
| Encryption    | Server-side (SSE-KMS) | Data encrypted at rest          |

## S3 Bucket Configuration

The S3 bucket is configured with the following settings:

| Setting         | Value    | Description                                |
| --------------- | -------- | ------------------------------------------ |
| Public Access   | Enabled  | Allows public read access to stored images |
| Versioning      | Disabled | Object versioning is not enabled           |
| Lifecycle Rules | None     | No automatic deletion rules configured     |

## Setup Requirements

### Environment Variables

The below environment variables will be created during the CLI initialization:

| Variable          | Description       | Required |
| :---------------- | :---------------- | :------- |
| POSTGRES_USER     | Database username | Yes      |
| POSTGRES_PASSWORD | Database password | Yes      |
| POSTGRES_DB_NAME  | Database name     | Yes      |

### Database Initialization

After deployment, the database initialization script (`npm run database:setup`) will:

- Create the vector extension
- Set up the database table structure
- Configure vector search indexes

## Connection Details

Connection details are automatically exported for use by other stacks:

- Database endpoint and port
- Credentials secret ARN
- S3 bucket name and ARN
