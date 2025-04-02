# Document Embedding Pipeline - Messaging Stack

## What This Does

The Messaging Stack creates a reliable queuing system that enables asynchronous processing of image embedding requests. This approach:

- Prevents request timeouts for users
- Allows processing to continue even during traffic spikes
- Provides automatic retry and error handling capabilities

## Components Created

| Resource                | Purpose                                      |
| :---------------------- | :------------------------------------------- |
| Main SQS Queue          | Holds pending image processing requests      |
| Dead Letter Queue (DLQ) | Captures failed requests for troubleshooting |

## How It Works

- When users submit images, they're added to the main queue
- The Image Ingestion Lambda processes one message at a time
- Successfully processed images are removed from the queue
- Failed processing attempts (after 3 retries) move to the DLQ

## Technical Configuration

| Setting            | Value      | Why This Matters                                     |
| :----------------- | :--------- | :--------------------------------------------------- |
| Visibility Timeout | 30 seconds | Matches Lambda timeout                               |
| Maximum Receives   | 3 attempts | Balances reliability with preventing endless retries |

## Best Practices

- Regularly inspect the DLQ for failed messages
- Configure SNS notifications for DLQ message arrivals
- Implement a redrive policy for recoverable errors
