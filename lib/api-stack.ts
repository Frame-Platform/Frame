import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cr from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";

// Props for the API Stack
export interface ApiStackProps extends cdk.StackProps {
  // The API Lambda function
  apiLambda: lambda.Function;
}

// Stack that creates the API Gateway for the document embedding pipeline
export class ApiStack extends cdk.Stack {
  // Make the API Gateway REST API public so it can be accessed from other stacks
  public readonly api: apigateway.RestApi;
  // Make the API key (for authentication) public so it can be accessed from other stacks
  public readonly apiKey: apigateway.ApiKey;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Create REST API with API key required
    this.api = new apigateway.RestApi(this, "DocumentEmbeddingApi", {
      binaryMediaTypes: [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "multipart/form-data",
      ],
      description: "Document Embedding API",
      // Allow requests from any domain via any HTTP method
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
      // Enable API key authentication
      // Will read the API key from the X-API-Key header of a request
      apiKeySourceType: apigateway.ApiKeySourceType.HEADER,
    });

    // Create usage plan - this specifies who can access one or more deployed API 'stages'
    // and methods, and the rate at which they can be accessed (using associated API Keys to
    // identify API clients and meter access to the associated API stage for each key)
    const usagePlan = new apigateway.UsagePlan(
      this,
      "DocumentEmbeddingUsagePlan",
      {
        name: "DocumentEmbeddingUsagePlan",
        description: "Usage plan for Document Embedding API",
        apiStages: [
          // Creates a connection between the usage plan and the API Gateway's default 'prod' stage
          {
            api: this.api,
            stage: this.api.deploymentStage,
          },
        ],
        /*
        // Allows a quota of 10,000 requests per month
        quota: {
          limit: 10000,
          period: apigateway.Period.MONTH,
        },
        // Throttle to 10 requests per second to prevent overwhelming API Gateway
        // Note: API Gateway uses token bucket algorithm for throttling
        throttle: {
          rateLimit: 10,
        },
        */
      }
    );

    // Create API key
    this.apiKey = new apigateway.ApiKey(this, "DocumentEmbeddingApiKey", {
      apiKeyName: "DocumentEmbeddingApiKey",
      description: "API key for Document Embedding API",
    });

    // Associate API key with usage plan
    // This finalises the connection of API Key -> Usage Plan -> API Stage
    usagePlan.addApiKey(this.apiKey);

    // Create Lambda integration with proxy
    // Defaults to using proxy integration rather than request/response mapping, meaning:
    // The entire request (including headers, query parameters, path parameters, body) is passed to the API Lambda
    // The API Lambda is expected to return a specific format that includes statusCode, headers, and body
    const apiLambdaIntegration = new apigateway.LambdaIntegration(
      props.apiLambda
    );

    // Set up proxy integration to forward all requests to Lambda
    const proxyResource = this.api.root.addProxy({
      defaultIntegration: apiLambdaIntegration,
      anyMethod: true, // Allow any HTTP method - Lambda function will receive requests with any method
      defaultMethodOptions: {
        // Require API key for all HTTP methods
        // i.e. all requests to API must include valid API key in X-API-Key header
        apiKeyRequired: true,
      },
    });

    // Create outputs for cross-stack references
    // I.e. other stacks can input the exportName parameter values using `Fn::ImportValue`.
    new cdk.CfnOutput(this, "ApiEndpoint", {
      value: this.api.url,
      description: "API Gateway endpoint URL",
      exportName: `${this.stackName}-ApiEndpoint`,
    });

    new cdk.CfnOutput(this, "ApiKeyId", {
      value: this.apiKey.keyId,
      description: "API Key ID",
      exportName: `${this.stackName}-ApiKeyId`,
    });
  }
}
