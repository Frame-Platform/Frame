import * as cdk from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
import { ComputeStack } from "../lib/compute-stack";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as s3 from "aws-cdk-lib/aws-s3";

let app: cdk.App;
let stack: ComputeStack;
let template: Template;

beforeEach(() => {
  app = new cdk.App();

  // Create mock resources needed for testing
  const mockStack = new cdk.Stack(app, "MockStack");
  const queue = new sqs.Queue(mockStack, "MockQueue");
  const bucket = new s3.Bucket(mockStack, "MockBucket");

  // Create the compute stack with required props
  stack = new ComputeStack(app, "TestComputeStack", {
    documentQueue: queue,
    databaseSecretArn: "arn:aws:secretsmanager:region:account:secret:name",
    databaseEndpoint: "test-db.cluster-123.region.rds.amazonaws.com",
    databasePort: "5432",
    imageBucket: bucket,
  });

  template = Template.fromStack(stack);
});

test("creates all Lambda functions with correct configuration", () => {
  // Verify three Lambda functions are created
  template.resourceCountIs("AWS::Lambda::Function", 3);

  // Verify API Lambda
  template.hasResourceProperties("AWS::Lambda::Function", {
    Handler: "index.handler",
    Runtime: "nodejs22.x",
    MemorySize: 1769,
    Timeout: 30,
    Environment: {
      Variables: {
        DOCUMENT_QUEUE_URL: Match.anyValue(),
        DATABASE_SECRET_ARN:
          "arn:aws:secretsmanager:region:account:secret:name",
        DATABASE_HOST: "test-db.cluster-123.region.rds.amazonaws.com",
        DATABASE_PORT: "5432",
        IMAGE_BUCKET_NAME: Match.anyValue(),
        DATABASE_NAME: Match.anyValue(),
        AWS_REGION: Match.anyValue(),
      },
    },
  });

  // Verify Image Ingestion Lambda
  template.hasResourceProperties("AWS::Lambda::Function", {
    Handler: "index.handler",
    Runtime: "nodejs22.x",
    MemorySize: 1769,
    Timeout: 30,
    Environment: {
      Variables: {
        DATABASE_SECRET_ARN:
          "arn:aws:secretsmanager:region:account:secret:name",
        DATABASE_HOST: "test-db.cluster-123.region.rds.amazonaws.com",
        DATABASE_PORT: "5432",
        BEDROCK_MODEL_ID: "amazon.titan-embed-image-v1",
        DATABASE_NAME: Match.anyValue(),
      },
    },
  });

  // Verify Search Lambda
  template.hasResourceProperties("AWS::Lambda::Function", {
    Handler: "index.handler",
    Runtime: "nodejs22.x",
    MemorySize: 1769,
    Timeout: 30,
    Environment: {
      Variables: {
        DATABASE_SECRET_ARN:
          "arn:aws:secretsmanager:region:account:secret:name",
        DATABASE_HOST: "test-db.cluster-123.region.rds.amazonaws.com",
        DATABASE_PORT: "5432",
        BEDROCK_MODEL_ID: "amazon.titan-embed-image-v1",
        DATABASE_NAME: Match.anyValue(),
      },
    },
  });
});

test("creates SQS event source mapping", () => {
  template.resourceCountIs("AWS::Lambda::EventSourceMapping", 1);

  template.hasResourceProperties("AWS::Lambda::EventSourceMapping", {
    BatchSize: 20,
    MaximumBatchingWindowInSeconds: 15,
    EventSourceArn: Match.anyValue(),
  });
});

test("creates IAM roles with correct permissions", () => {
  // Check for IAM roles
  const roles = template.findResources("AWS::IAM::Role");
  expect(Object.keys(roles).length).toBeGreaterThan(0);

  // Check for Secrets Manager permissions
  template.hasResourceProperties("AWS::IAM::Policy", {
    PolicyDocument: {
      Statement: Match.arrayWith([
        Match.objectLike({
          Action: "secretsmanager:GetSecretValue",
          Effect: "Allow",
          Resource: "arn:aws:secretsmanager:region:account:secret:name",
        }),
      ]),
    },
  });

  // Grants API Lambda permission to invoke Search Lambda
  template.hasResourceProperties("AWS::IAM::Policy", {
    PolicyDocument: {
      Statement: Match.arrayWith([
        Match.objectLike({
          Action: "lambda:InvokeFunction",
          Effect: "Allow",
          Resource: Match.anyValue(),
        }),
      ]),
    },
  });

  // Grants API Lambda permissions for S3 operations
  template.hasResourceProperties("AWS::IAM::Policy", {
    PolicyDocument: {
      Statement: Match.arrayWith([
        Match.objectLike({
          Action: ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
          Effect: "Allow",
        }),
      ]),
    },
  });
});

test("creates correct CloudFormation outputs", () => {
  template.hasOutput("ApiLambdaArn", {});
  template.hasOutput("ImageIngestionArn", {});
  template.hasOutput("SearchLambdaArn", {});
});
