import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { ApiStack } from "../lib/api-stack";
import * as lambda from "aws-cdk-lib/aws-lambda";

let app: cdk.App;
let stack: ApiStack;
let template: Template;

beforeEach(() => {
  app = new cdk.App();

  // Create mock Lambda for testing
  const mockLambda = new lambda.Function(
    new cdk.Stack(app, "MockStack"),
    "MockLambda",
    {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromInline(
        "exports.handler = async () => { return { statusCode: 200 }; }"
      ),
    }
  );

  // Create the API stack with required props
  stack = new ApiStack(app, "TestApiStack", {
    apiLambda: mockLambda,
  });

  template = Template.fromStack(stack);
});

test("creates API Gateway with correct configuration", () => {
  // Verify API Gateway is created
  template.resourceCountIs("AWS::ApiGateway::RestApi", 1);

  // Verify API Gateway configuration
  template.hasResourceProperties("AWS::ApiGateway::RestApi", {
    Description: "Document Embedding API",
    ApiKeySourceType: "HEADER",
  });

  // Verify deployment stage with correct name
  template.hasResourceProperties("AWS::ApiGateway::Stage", {
    StageName: "prod",
  });
});

test("creates API key and usage plan", () => {
  // Verify API key is created
  template.resourceCountIs("AWS::ApiGateway::ApiKey", 1);

  // Verify usage plan is created
  template.resourceCountIs("AWS::ApiGateway::UsagePlan", 1);

  /*
  // Verify usage plan configuration
  template.hasResourceProperties("AWS::ApiGateway::UsagePlan", {
    Quota: {
      Limit: 10000,
      Period: "MONTH",
    },
    Throttle: {
      RateLimit: 10,
    },
  });
  */

  // Verify API key is associated with usage plan
  template.resourceCountIs("AWS::ApiGateway::UsagePlanKey", 1);
});

test("creates proxy resource with API key requirement", () => {
  // Verify ANY method is created on proxy resource
  template.hasResourceProperties("AWS::ApiGateway::Method", {
    HttpMethod: "ANY",
    ApiKeyRequired: true,
    AuthorizationType: "NONE",
  });
});

test("creates CloudFormation outputs", () => {
  template.hasOutput("ApiEndpoint", {});
  template.hasOutput("ApiKeyId", {});
});
