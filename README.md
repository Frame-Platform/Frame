## Overview

This repository contains an automated deployment process for an image-embedding pipeline designed to be deployed remotely to an end user's AWS account. The pipeline enables efficient processing and embedding of images for applications which require easy access to embeddings associated with image data, without the hassle of building out custom infrastructure, connecting to AI models etc.

## Infrastructure Overview

The image-embedding pipeline deploys several key components in your AWS account using AWS CDK (Cloud Development Kit).

[ADD INFRASTRUCTURE DIAGRAM HERE]

Full details of the infrastructure to be deployed for each individual stack can be found in the `docs` folder of this repository. Please ensure you review these documents before deploying the infrastructure.

## Prerequisites

Before deploying the infrastructure, ensure you have the following prerequisites set up:

- An active AWS account with appropriate permissions.
- Node.js (version 14.15.0 or later) and npm installed on your system: https://nodejs.org/en/download/.
- AWS CLI installed and configured with access credentials. Details of how to do so can be found here: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html.
- AWS CDK installed: https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html.
- TypeScript 3.8 or later installed on your system: `npm -g install typescript`.
- Git installed on your system: https://git-scm.com/book/en/v2/Getting-Started-Installing-Git.
- Sufficient AWS quota limits for the services being deployed

## Deployment Process

### Step 1: Installation

- Clone the repository: `git clone https://github.com/UntitledCapstoneProj/new.git`.
- Move into the top-level directory with `cd new`.

### Step 2: Build the Project Environment

- Run `npm run build:all`. This will run the `build-all.js` script to:
  - Set up the project environment by installing the required dependencies for the CLI and the CDK.
  - Build the CLI by compiling the TypeScript files into JavaScript.
  - Link the CLI globally on your system (so as to enable the use of the `document-embedding` commands referenced below).
  - Build the Lambda functions referenced in the CDK (packaging them up into zip files ready for deployment).

### Step 3: Initialize the Environment

Initialize the environment variables specific to your AWS account with `document-embedding init`.

This command will guide you through the initialization process. In particular, you will be prompted to provide the following information:

- AWS Access Key ID (can be obtained in the AWS console)
- AWS Secret Access Key (can be obtained in the AWS console)
- AWS Region
- PostgreSQL Username
- PostgreSQL Password
- PostgreSQL Database Name
- PostgreSQL Table Name

Any other configuration parameters specific to your deployment

This information will be securely stored and used during the deployment process.

### Step 4: Deploy the Infrastructure

Deploy the image-embedding pipeline to your AWS account: with `document-embedding deploy`.

During the deployment:

- The CDK will create all necessary AWS resources. This process can take several minutes so please be patient.
- Upon completion, you'll receive confirmation of successful deployment along with important endpoints or access information for the created resources.
- In particular, you will receive confirmation of the API Gateway URL and your specific API Access Key details. These details are required to connect to the API Gateway endpoints via our SDK client.

### Step 5: Verify the Deployment

After successful deployment, verify that all components are working correctly:

- Check the AWS Management Console to confirm resources have been created.
- Test the image embedding functionality by uploading a sample image via our SDK client.

### Step 6: Add AWS Access to Amazon Bedrock Foundation Models

Current details of how to do this can be found here: https://docs.aws.amazon.com/bedrock/latest/userguide/model-access-modify.html

At the time of writing, you will need to:

- Make sure you have permission to request access, or modify access, to Amazon Bedrock foundation models.
- Navigate to the Amazon Bedrock console in your AWS account.
- In the left navigation pane, under Bedrock configurations, choose Model access.
- Select 'Enable Specific Models':
  - Select the models that you want the account to have access to and unselect the models that you don't want the account to have access to. In this case, we need the model to have access to the Amazon Titan Multimodal Embeddings G1 model so select the check box next to this model.
- Select 'Next' then 'Submit'.
- It may take several minutes to receive or remove access to models but, once access is granted, you should see 'Access granted' next to the model name.

### Step 7 (if relevant and necessary): Destroy the Infrastructure

When you no longer need the image-embedding pipeline, you can remove all deployed resources with `document-embedding destroy`.

Important:

- This action will permanently delete all resources created by the deployment
- All stored data, including images and embeddings, will be lost
- This operation cannot be undone, so proceed with caution

## Usage

Once deployed, you can use the image-embedding pipeline to:

- Upload image(s) for easy embedding.
- Carry out similarity searches on your embedded images against a provided text snippet or against another image.
- Query the PostgreSQL database to read, update or delete embeddings.
- Integrate with your existing applications using the provided endpoints and our SDK client.

## Monitoring and Troubleshooting

The deployed infrastructure includes CloudWatch logs and metrics for monitoring:

- Lambda function executions and errors
- Database connection status
- S3 bucket operations

[TO DOUBLE CHECK]

To access logs and metrics:

- Navigate to the AWS CloudWatch console
- Select the appropriate log group for the component you want to monitor
- Review logs for any error messages or performance issues.
