#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { MessagingStack } from "../lib/messaging-stack";
import { StorageStack } from "../lib/storage-stack";
import { ComputeStack } from "../lib/compute-stack";
import { ApiStack } from "../lib/api-stack";

const app = new cdk.App();

const messagingStack = new MessagingStack(app, "MessagingStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

const storageStack = new StorageStack(app, "StorageStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

const computeStack = new ComputeStack(app, "ComputeStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  documentQueue: messagingStack.documentQueue,
  databaseSecretArn: storageStack.databaseSecret.secretArn,
  databaseEndpoint: storageStack.database.dbInstanceEndpointAddress,
  databasePort: storageStack.database.dbInstanceEndpointPort,
  imageBucket: storageStack.imageBucket,
});

const apiStack = new ApiStack(app, "ApiStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  apiLambda: computeStack.apiLambda,
});

computeStack.addDependency(messagingStack);
computeStack.addDependency(storageStack);
apiStack.addDependency(computeStack);
