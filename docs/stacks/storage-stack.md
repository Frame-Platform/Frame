# Document Embedding Pipeline - Storage Stack

The Storage Stack component of the Document Embedding Pipeline sets up the database using RDS PostgreSQL.

## Overview

The Storage Stack creates the following AWS resources:

- VPC with public subnet (for easy Lambda accessibility)
- RDS PostgreSQL 17 database
- Database parameter group optimized for vector operations
- Secrets Manager secret for database credentials
- Security group for database access (allowing access from any IP)
- S3 bucket for storing image files uploaded through the API

## S3 Bucket Configuration

The S3 bucket is configured with the following settings:

| Setting         | Value    | Description                                |
| --------------- | -------- | ------------------------------------------ |
| Public Access   | Enabled  | Allows public read access to stored images |
| CORS            | Enabled  | Allows cross-origin requests               |
| Versioning      | Disabled | Object versioning is not enabled           |
| Lifecycle Rules | None     | No automatic deletion rules configured     |

## SECURITY CONSIDERATIONS

The current configuration has several temporary security settings that should be improved for production use:

1. **Public Database Access**: The RDS instance is **publicly accessible** and allows connections from any IP
2. **Simplified VPC Configuration**: Only public subnets are used instead of a proper public/private subnet architecture
3. **Broad Security Group Rules**: The security group allows PostgreSQL access from any IP address

### Recommended Security Improvements for Production

Before deploying to production, consider these security enhancements:

1. **VPC Architecture**:

   - Create a VPC with both public AND private subnets
   - Place the RDS instance in private subnets
   - Add NAT Gateways for outbound connectivity (but no inbound)

2. **Lambda Configuration**:

   - Place Lambda functions in the same VPC as the RDS
   - Use security groups to control access between Lambda and RDS
   - Consider using VPC endpoints for AWS services

3. **Security Group Rules**:

   - Remove the open ingress rule that allows access from any IP
   - Configure security groups to only allow traffic between specific resources

4. **Networking**:

   - Set `publiclyAccessible: false` on the RDS instance
   - Remove direct public access to the database

5. **S3 Bucket**:

   - Restrict public access, using pre-signed URLs
   - Implement object-level permissions
   - Set up CloudFront distribution for secure content delivery

## RDS Database Configuration

The database is configured with the following settings:

| Setting              | Value                                           | Description                                           |
| -------------------- | ----------------------------------------------- | ----------------------------------------------------- |
| Instance Type        | t3.micro                                        | Low cost                                              |
| Deletion Protection  | Disabled in development / Enabled in production | Prevents accidental deletion                          |
| VPC Placement        | Public Subnet                                   | **TEMPORARY**: Should be private subnet in production |
| Public Accessibility | Enabled                                         | **TEMPORARY**: Should be disabled in production       |
| Security Group       | Open access (port 5432)                         | **TEMPORARY**: Should be restricted in production     |

### Configuration

The PostgreSQL instance is configured with optimized parameters:

- `max_parallel_workers_per_gather`: 4 parallel workers per gather
- `work_mem`: 16MB for improved query performance
- `maintenance_work_mem`: 128MB for maintenance operations

Note that: The pgvector library cannot be installed programmatically via CDK and must be installed separately via an initialisation script (see below).

## Database Credentials

Database credentials are:

1. Collected during deployment via environment variables
2. Stored in AWS Secrets Manager for secure access by Lambda functions

## Secrets Manager

A simplified Secrets Manager secret stores essential database credentials:

- Database name
- Username
- Password

## Environment Variables

| Variable          | Description         | Required |
| ----------------- | ------------------- | -------- |
| POSTGRES_USER     | PostgreSQL username | Yes      |
| POSTGRES_PASSWORD | PostgreSQL password | Yes      |
| POSTGRES_DB_NAME  | Database name       | Yes      |

### Accessing Database Credentials

Lambda functions should retrieve credentials from Secrets Manager:

```javascript
// Example code for Lambda functions
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

async function getDatabaseCredentials(secretArn) {
  const client = new SecretsManagerClient();
  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: secretArn,
    })
  );
  return JSON.parse(response.SecretString);
}
```

## Cost Considerations

The t3.micro instance costs approximately $10 per month
AWS Secrets Manager costs approximately $0.40 per secret per month
⚠️ Note: Auto-scaling storage will increase costs as your database grows

## Deployment

The environment variables required by this stack (DB_USERNAME and DB_PASSWORD) will be collected by the CLI deployment wizard and stored in a .env file.

## Database Initialization

After deployment, the necessary database table can be created and the pgvector extension installed by running the initialisation script in `scripts/db-init.sql`

## Cross-Stack References

The following resources are exported for use in other stacks:

- Database endpoint and port
- Database credentials secret ARN
- S3 bucket name and ARN
