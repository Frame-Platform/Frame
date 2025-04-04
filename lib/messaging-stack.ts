import * as cdk from "aws-cdk-lib";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import * as dotenv from "dotenv";

dotenv.config();

export class MessagingStack extends cdk.Stack {
  public readonly documentQueue: sqs.Queue;
  public readonly deadLetterQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.deadLetterQueue = new sqs.Queue(this, "DocumentDLQ", {
      queueName: `${id}-dlq`,
    });

    this.documentQueue = new sqs.Queue(this, "DocumentQueue", {
      queueName: `${id}-queue`,
      visibilityTimeout: cdk.Duration.seconds(30),
      deadLetterQueue: {
        queue: this.deadLetterQueue,
        maxReceiveCount: 3,
      },
    });

    new cdk.CfnOutput(this, "DocumentQueueUrl", {
      value: this.documentQueue.queueUrl,
      description: "URL of the main document processing queue",
      exportName: `${this.stackName}-DocumentQueueUrl`,
    });

    new cdk.CfnOutput(this, "DocumentQueueArn", {
      value: this.documentQueue.queueArn,
      description: "ARN of the main document processing queue",
      exportName: `${this.stackName}-DocumentQueueArn`,
    });

    new cdk.CfnOutput(this, "DeadLetterQueueUrl", {
      value: this.deadLetterQueue.queueUrl,
      description: "URL of the dead-letter queue",
      exportName: `${this.stackName}-DeadLetterQueueUrl`,
    });
  }
}
