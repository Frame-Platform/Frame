# Document Embedding Pipeline - API Stack

The API Stack component of the Document Embedding Pipeline creates the API Gateway for accessing the document embedding and search capabilities.

## Overview

The API Stack creates the following AWS resources:

- API Gateway REST API
- API Key for authentication
- Usage plan with quotas and throttling
- Lambda proxy integration with the API Lambda

## API Gateway Configuration

The API Gateway is configured with the following settings:

| Setting        | Value   | Description                                                                                            |
| -------------- | ------- | ------------------------------------------------------------------------------------------------------ |
| Stage          | prod    | Production stage for the API                                                                           |
| CORS           | Enabled | Cross-Origin Resource Sharing for browser access - Allows requests from any domain via any HTTP method |
| Authentication | API Key | API key required for all requests                                                                      |

## API Key Authentication

All API endpoints require an API key for authentication. The API key is generated during deployment and can be retrieved from the CloudFormation outputs.

### Retrieving the API Key

After deployment, users can retrieve the API key using the AWS CLI:

```bash
# Get the API key ID from CloudFormation outputs
API_KEY_ID=$(aws cloudformation describe-stacks --stack-name ApiStack --query "Stacks[0].Outputs[?OutputKey=='ApiKeyId'].OutputValue" --output text)

# Get the API key value
API_KEY=$(aws apigateway get-api-key --api-key $API_KEY_ID --include-value --query "value" --output text)

echo "Your API Key: $API_KEY"
```

### Using the API Key

When making requests to the API, include the API key in the `x-api-key` header.
