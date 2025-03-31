import * as cdk from "aws-cdk-lib";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Stack that creates SQS queue for document processing
export class MessagingStack extends cdk.Stack {
  // Make the main documentQueue available to other stacks
  public readonly documentQueue: sqs.Queue;
  // Make the dead-letter queue for failed message processing available to other stacks
  public readonly deadLetterQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the Dead Letter Queue with default settings
    // Note visibilityTimeout should match preprocess lambda timeout
    this.deadLetterQueue = new sqs.Queue(this, "DocumentDLQ", {
      queueName: `${id}-dlq`,
    });

    // Create the main document processing queue with default settings
    // Note visibilityTimeout should match preprocess lambda timeout
    this.documentQueue = new sqs.Queue(this, "DocumentQueue", {
      queueName: `${id}-queue`,
      visibilityTimeout: cdk.Duration.seconds(30),
      deadLetterQueue: {
        queue: this.deadLetterQueue,
        maxReceiveCount: 3,
      },
    });

    // Create outputs for cross-stack references
    // Other stacks can input the exportName parameter values using `Fn::ImportValue`.
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
