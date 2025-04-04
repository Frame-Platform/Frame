import * as cdk from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
import { MessagingStack } from "../lib/messaging-stack";

test("creates queues with correct configuration", () => {
  const app = new cdk.App();
  const stack = new MessagingStack(app, "TestMessagingStack");
  const template = Template.fromStack(stack);

  template.resourceCountIs("AWS::SQS::Queue", 2);

  template.hasResourceProperties("AWS::SQS::Queue", {
    QueueName: "TestMessagingStack-queue",
    VisibilityTimeout: 30,
    RedrivePolicy: {
      deadLetterTargetArn: Match.objectLike({
        "Fn::GetAtt": Match.arrayWith([
          Match.stringLikeRegexp("DocumentDLQ"),
          "Arn",
        ]),
      }),
      maxReceiveCount: 3,
    },
  });

  template.hasResourceProperties("AWS::SQS::Queue", {
    QueueName: "TestMessagingStack-dlq",
  });

  template.hasOutput("DocumentQueueUrl", {});
  template.hasOutput("DocumentQueueArn", {});
  template.hasOutput("DeadLetterQueueUrl", {});
});
