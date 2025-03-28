# Document Embedding Pipeline - Messaging Stack

The Messaging Stack component of the Document Embedding Pipeline handles asynchronous processing of document embedding requests (via SQS and an associated Dead Letter Queue)

## Overview

The Messaging Stack creates the following AWS resources:

- A main SQS queue for document processing
- A dead-letter queue (DLQ) for failed message processing

## Queue Configuration

The SQS queues are configured with the following non-default settings:

- Visibility Timeout (How long a message is invisible after a consumer receives it): 15 minutes

This setting is intended to match the timeout of the pre-processing lambda which takes documents from the main SQS queue and is optimized for document processing workloads (providing a balance of reliability and cost-effectiveness).

## Cost Considerations

- SQS pricing is based on the number of requests, with the first 1 million requests per month included in the free tier

## Monitoring Recommendations

- Set up CloudWatch Alarms for the following metrics:
  - `ApproximateNumberOfMessagesVisible` - To monitor queue depth
  - `ApproximateAgeOfOldestMessage` - To detect stalled processing
  - `NumberOfMessagesSent` to the DLQ - To detect processing failures

## Troubleshooting

### Common Issues

1. **Messages Moving to DLQ**:

   - Check Lambda logs for errors
   - The system will attempt to process each message 3 times before moving it to the DLQ

2. **Queue Backing Up**:
   - Check Lambda concurrency settings
   - Verify Lambda functions are processing messages correctly
   - Consider increasing Lambda concurrency limits
