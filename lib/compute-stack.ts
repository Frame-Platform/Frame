import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as dotenv from "dotenv";
import { Construct } from "constructs";

dotenv.config();

export interface ComputeStackProps extends cdk.StackProps {
  documentQueue: sqs.Queue;
  databaseSecretArn: string;
  databaseEndpoint: string;
  databasePort: string;
  imageBucket: s3.Bucket;
}

export class ComputeStack extends cdk.Stack {
  public readonly apiLambda: lambda.Function;
  public readonly imageIngestionLambda: lambda.Function;
  public readonly searchLambda: lambda.Function;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const dbName = process.env.POSTGRES_DB_NAME || "fallback";

    const s3Layer = new lambda.LayerVersion(this, "S3Layer", {
      code: lambda.Code.fromAsset("lambda/layers/aws-sdk-s3/lambda-layer.zip"),
    });

    const dotenvLayer = new lambda.LayerVersion(this, "DotenvLayer", {
      code: lambda.Code.fromAsset("lambda/layers/dotenv/lambda-layer.zip"),
    });

    const honoProxyLayer = new lambda.LayerVersion(this, "HonoProxyLayer", {
      code: lambda.Code.fromAsset(
        "lambda/layers/honoProxyLayer/lambda-layer.zip"
      ),
    });

    const pgLayer = new lambda.LayerVersion(this, "PGLayer", {
      code: lambda.Code.fromAsset("lambda/layers/pg/lambda-layer.zip"),
    });

    const sharpLayer = new lambda.LayerVersion(this, "SharpLayer", {
      code: lambda.Code.fromAsset("lambda/layers/sharp/lambda-layer.zip"),
    });

    const zodLayer = new lambda.LayerVersion(this, "ZodLayer", {
      code: lambda.Code.fromAsset("lambda/layers/zod/lambda-layer.zip"),
    });

    const apiLambdaRole = new iam.Role(this, "APIRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSQSFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AWSLambda_FullAccess"),
      ],
    });

    apiLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["secretsmanager:GetSecretValue"],
        resources: [props.databaseSecretArn],
      })
    );

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

    this.apiLambda = new lambda.Function(this, "ApiLambda", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("lambda/lambdaDist/honoProxy.zip"),
      memorySize: 1769,
      timeout: cdk.Duration.seconds(30),
      environment: {
        DOCUMENT_QUEUE_URL: props.documentQueue.queueUrl,
        DATABASE_SECRET_ARN: props.databaseSecretArn,
        DATABASE_HOST: props.databaseEndpoint,
        DATABASE_PORT: props.databasePort,
        DATABASE_NAME: dbName,
        SEARCH_LAMBDA_ARN: "",
        IMAGE_BUCKET_NAME: props.imageBucket.bucketName,
      },
      role: apiLambdaRole,
      layers: [s3Layer, pgLayer, dotenvLayer, honoProxyLayer],
    });

    props.documentQueue.grantSendMessages(this.apiLambda);
    props.imageBucket.grantPut(this.apiLambda);
    props.imageBucket.grantDelete(this.apiLambda);

    const imageIngestionRole = new iam.Role(this, "ImageIngestionRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonBedrockFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaSQSQueueExecutionRole"
        ),
      ],
    });

    imageIngestionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["secretsmanager:GetSecretValue"],
        resources: [props.databaseSecretArn],
      })
    );

    this.imageIngestionLambda = new lambda.Function(
      this,
      "ImageIngestionLambda",
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: "index.handler",
        code: lambda.Code.fromAsset("lambda/lambdaDist/ingestionLambda.zip"),
        memorySize: 1769,
        timeout: cdk.Duration.seconds(30),
        environment: {
          DATABASE_SECRET_ARN: props.databaseSecretArn,
          DATABASE_HOST: props.databaseEndpoint,
          DATABASE_PORT: props.databasePort,
          BEDROCK_MODEL_ID: "amazon.titan-embed-image-v1",
          DATABASE_NAME: dbName,
        },
        role: imageIngestionRole,
        layers: [sharpLayer, pgLayer, dotenvLayer, zodLayer],
      }
    );

    this.imageIngestionLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(props.documentQueue, {
        batchSize: 1,
      })
    );

    const searchRole = new iam.Role(this, "SearchRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonBedrockFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaSQSQueueExecutionRole"
        ),
      ],
    });

    searchRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["secretsmanager:GetSecretValue"],
        resources: [props.databaseSecretArn],
      })
    );

    this.searchLambda = new lambda.Function(this, "SearchLambda", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("lambda/lambdaDist/searchLambda.zip"),
      memorySize: 1769,
      timeout: cdk.Duration.seconds(30),
      environment: {
        DATABASE_SECRET_ARN: props.databaseSecretArn,
        DATABASE_HOST: props.databaseEndpoint,
        DATABASE_PORT: props.databasePort,
        BEDROCK_MODEL_ID: "amazon.titan-embed-image-v1",
        DATABASE_NAME: dbName,
      },
      role: searchRole,
      layers: [sharpLayer, pgLayer, zodLayer, dotenvLayer],
    });

    this.apiLambda.addEnvironment(
      "SEARCH_LAMBDA_ARN",
      this.searchLambda.functionArn
    );

    this.searchLambda.grantInvoke(this.apiLambda);

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
