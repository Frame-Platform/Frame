import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

// Props for the Compute Stack (third argument)
export interface ComputeStackProps extends cdk.StackProps {
  // The SQS queue for document processing - relevant to imageIngestion lambda
  documentQueue: sqs.Queue;
  // The ARN of the database credentials secret - relevant for getting credentials to
  // enable interfacing with RDS vector DB
  databaseSecretArn: string;
  // The database endpoint - relevant for getting credentials to
  // enable interfacing with RDS vector DB
  databaseEndpoint: string;
  // The database port - relevant for getting credentials to
  // enable interfacing with RDS vector DB
  databasePort: string;
  // The S3 image bucket - relevant for allowing the API lambda to deal with image file
  // inputs
  imageBucket: s3.Bucket;
}

// Stack that creates Lambda functions for the document embedding pipeline
export class ComputeStack extends cdk.Stack {
  // Make the API Lambda (for handling HTTP requests) available to other stacks
  public readonly apiLambda: lambda.Function;
  // Make the Image Ingestion Lambda (for processing documents) available to other stacks
  public readonly imageIngestionLambda: lambda.Function;
  // Make the Search Lambda (for handling similarity searches) available to other stacks
  public readonly searchLambda: lambda.Function;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Create base IAM role for Lambda functions
    // Enables lambdas to Write logs to CloudWatch Logs
    // (create log groups, create log streams, and put log events)
    const apiLambdaRole = new iam.Role(this, "APIRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });

    // Add permission to get database credentials from IAM
    // Note: No additional AWS IAM permissions are needed for the Lambda functions
    // to connect to the database because RDS instance is configured to be publicly
    // accessible (with publiclyAccessible: true), and its security group
    // allows connections from any IP address (with the 0.0.0.0/0 ingress rule)
    apiLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["secretsmanager:GetSecretValue"],
        resources: [props.databaseSecretArn],
      })
    );

    // Add S3 permissions for API Lambda
    apiLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "AllowAPIHonoProxyGetPutDeleteToS3",
        effect: iam.Effect.ALLOW,
        actions: ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
        resources: [
          props.imageBucket.bucketArn,
          props.imageBucket.arnForObjects("*"),
        ],
      })
    );

    // API Lambda (Hono)
    this.apiLambda = new lambda.Function(this, "ApiLambda", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      // NOTE: Still need code and to route to correct file
      code: lambda.Code.fromAsset("lambda/api"),
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      environment: {
        DOCUMENT_QUEUE_URL: props.documentQueue.queueUrl,
        DATABASE_SECRET_ARN: props.databaseSecretArn,
        DATABASE_HOST: props.databaseEndpoint,
        DATABASE_PORT: props.databasePort,
        SEARCH_LAMBDA_ARN: "", // Updated after the search lambda is created (below)
        IMAGE_BUCKET_NAME: props.imageBucket.bucketName,
      },
      role: apiLambdaRole,
    });

    // Grant API Lambda permission to send messages to SQS
    props.documentQueue.grantSendMessages(this.apiLambda);

    // Create role for the image ingestion lambda with base permissions
    const imageIngestionRole = new iam.Role(this, "ImageIngestionRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });

    // Add Bedrock permissions
    imageIngestionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["bedrock:InvokeModel"],
        resources: ["*"], // Scope this down to specific model in production
      })
    );

    // Add database access permissions for image ingestion lambda
    imageIngestionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["secretsmanager:GetSecretValue"],
        resources: [props.databaseSecretArn],
      })
    );

    // Image Ingestion Lambda
    this.imageIngestionLambda = new lambda.Function(
      this,
      "ImageIngestionLambda",
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: "index.handler",
        // NOTE: Still need code and to route to correct file
        code: lambda.Code.fromAsset("lambda/imageIngestion"),
        memorySize: 1024, // Higher memory for image processing
        // Default memory is 128MB - Max is 10,240 MB
        // Longer timeout for image ingestion Lambda
        timeout: cdk.Duration.minutes(15),
        environment: {
          DATABASE_SECRET_ARN: props.databaseSecretArn,
          DATABASE_HOST: props.databaseEndpoint,
          DATABASE_PORT: props.databasePort,
          BEDROCK_MODEL_ID: "amazon.titan-embed-image-v1",
        },
        role: imageIngestionRole,
      }
    );

    // Set up SQS trigger for Image Ingestion Lambda
    this.imageIngestionLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(props.documentQueue, {
        batchSize: 1, // Process 1 message at a time
      })
    );

    // Create role for the search lambda with base permissions
    const searchRole = new iam.Role(this, "SearchRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });

    // Add Bedrock permissions
    searchRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["bedrock:InvokeModel"],
        resources: ["*"], // Scope this down to specific model in production
      })
    );

    // Add database access permissions for search lambda
    searchRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["secretsmanager:GetSecretValue"],
        resources: [props.databaseSecretArn],
      })
    );

    // Search Lambda
    this.searchLambda = new lambda.Function(this, "SearchLambda", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      // NOTE: Still need code and to route to correct file
      code: lambda.Code.fromAsset("lambda/search"),
      // Higher memory for image processing
      // Default memory is 128MB - Max is 10,240 MB
      memorySize: 1024,
      // Longer timeout for search Lambda
      timeout: cdk.Duration.seconds(30),
      environment: {
        DATABASE_SECRET_ARN: props.databaseSecretArn,
        DATABASE_HOST: props.databaseEndpoint,
        DATABASE_PORT: props.databasePort,
        BEDROCK_MODEL_ID: "amazon.titan-embed-image-v1",
      },
      role: searchRole,
    });

    // Update API Lambda environment with Search Lambda ARN
    this.apiLambda.addEnvironment(
      "SEARCH_LAMBDA_ARN",
      this.searchLambda.functionArn
    );

    // Allow API Lambda to invoke Search Lambda
    this.searchLambda.grantInvoke(this.apiLambda);

    // Create outputs for cross-stack references
    // I.e. other stacks can input the exportName parameter values using `Fn::ImportValue`.
    new cdk.CfnOutput(this, "ApiLambdaArn", {
      value: this.apiLambda.functionArn,
      description: "The ARN of the API Lambda function",
      exportName: `${this.stackName}-ApiLambdaArn`,
    });

    new cdk.CfnOutput(this, "ImageIngestionArn", {
      value: this.imageIngestionLambda.functionArn,
      description: "The ARN of the Image Ingestion Lambda function",
      exportName: `${this.stackName}-ImageIngestionLambdaArn`,
    });

    new cdk.CfnOutput(this, "SearchLambdaArn", {
      value: this.searchLambda.functionArn,
      description: "The ARN of the Search Lambda function",
      exportName: `${this.stackName}-SearchLambdaArn`,
    });
  }
}
