import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export interface ApiStackProps extends cdk.StackProps {
  apiLambda: lambda.Function;
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly apiKey: apigateway.ApiKey;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    this.api = new apigateway.RestApi(this, "DocumentEmbeddingApi", {
      binaryMediaTypes: [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "multipart/form-data",
      ],
      description: "Document Embedding API",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
      apiKeySourceType: apigateway.ApiKeySourceType.HEADER,
    });

    const usagePlan = new apigateway.UsagePlan(
      this,
      "DocumentEmbeddingUsagePlan",
      {
        name: "DocumentEmbeddingUsagePlan",
        description: "Usage plan for Document Embedding API",
        apiStages: [
          {
            api: this.api,
            stage: this.api.deploymentStage,
          },
        ],
      }
    );

    this.apiKey = new apigateway.ApiKey(this, "DocumentEmbeddingApiKey", {
      apiKeyName: "DocumentEmbeddingApiKey",
      description: "API key for Document Embedding API",
    });

    usagePlan.addApiKey(this.apiKey);

    const apiLambdaIntegration = new apigateway.LambdaIntegration(
      props.apiLambda
    );

    const proxyResource = this.api.root.addProxy({
      defaultIntegration: apiLambdaIntegration,
      anyMethod: true,
      defaultMethodOptions: {
        apiKeyRequired: true,
      },
    });

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
