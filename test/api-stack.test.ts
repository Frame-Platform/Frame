import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { ApiStack } from "../lib/api-stack";
import * as lambda from "aws-cdk-lib/aws-lambda";

let app: cdk.App;
let stack: ApiStack;
let template: Template;

beforeEach(() => {
  app = new cdk.App();

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

  stack = new ApiStack(app, "TestApiStack", {
    apiLambda: mockLambda,
  });

  template = Template.fromStack(stack);
});

test("creates API Gateway with correct configuration", () => {
  template.resourceCountIs("AWS::ApiGateway::RestApi", 1);

  template.hasResourceProperties("AWS::ApiGateway::RestApi", {
    Description: "Document Embedding API",
    ApiKeySourceType: "HEADER",
  });

  template.hasResourceProperties("AWS::ApiGateway::Stage", {
    StageName: "prod",
  });
});

test("creates API key and usage plan", () => {
  template.resourceCountIs("AWS::ApiGateway::ApiKey", 1);

  template.resourceCountIs("AWS::ApiGateway::UsagePlan", 1);

  template.resourceCountIs("AWS::ApiGateway::UsagePlanKey", 1);
});

test("creates proxy resource with API key requirement", () => {
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
