import * as cdk from "aws-cdk-lib";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Stack that creates the vector database using RDS PostgreSQL
// Note: pgvector needs to be added via a script after RDS installation - it cannot be configured by CDK
export class StorageStack extends cdk.Stack {
  // Make the RDS PostgreSQL database instance publicly accessible from other stacks
  public readonly database: rds.DatabaseInstance;
  // Make the VPC where the database is deployed publicly accessible from other stacks
  public readonly vpc: ec2.Vpc;
  // Make the Secrets Manager secret containing database credentials
  // publicly accessible so database credentials can be accessed from Lambdas
  public readonly databaseSecret: secretsmanager.Secret;
  // Make the image S3 bucket publicly accessible for other stacks
  public readonly imageBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get database credentials from environment variables
    const dbUsername = process.env.POSTGRES_USER || "postgres";
    const dbPassword = process.env.POSTGRES_PASSWORD || "fallback";
    const dbName = process.env.POSTGRES_DB_NAME || "fallback";

    /*
    // Validate that required environment variables are set
    if (!dbPassword || !dbName) {
      throw new Error("POSTGRES_PASSWORD environment variable must be set");
    }
      */

    // Create a VPC for the database with public subnets
    this.vpc = new ec2.Vpc(this, "DatabaseVPC", {
      // Only create public subnets for simplicity in this temporary solution
      subnetConfiguration: [
        {
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // Create security group within the database VPC for the database
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      "DatabaseSecurityGroup",
      {
        vpc: this.vpc,
        description: "Security Group for Vector Database",
        allowAllOutbound: true,
      }
    );

    // Allow PostgreSQL access from any IP (temporary solution)
    // SECURITY NOTE: This is not recommended for production environments
    dbSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.POSTGRES,
      "Allow PostgreSQL access from anywhere (TEMPORARY)"
    );

    // Create a Secrets Manager secret with database credentials
    // This allows Lambda functions to securely access the credentials
    this.databaseSecret = new secretsmanager.Secret(
      this,
      "DatabaseCredentials",
      {
        secretName: `${id}-db-credentials`,
        description: "Credentials for the document embedding vector database",
        secretStringValue: cdk.SecretValue.unsafePlainText(
          JSON.stringify({
            username: dbUsername,
            // Security concern of including dbPassword in CloudFormation
            // template - is there a better way?
            password: dbPassword,
            dbname: dbName,
          })
        ),
      }
    );

    // Create a parameter group for RDS
    const parameterGroup = new rds.ParameterGroup(
      this,
      "DatabaseParameterGroup",
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_17,
        }),
        description: "Parameter group for PostgreSQL vector database",
        parameters: {
          // Optimize for vector operations
          max_parallel_workers_per_gather: "4",
          // Memory settings for better performance
          work_mem: "16384", // 16MB
          maintenance_work_mem: "128000", // 128MB
        },
      }
    );

    // Create RDS instance
    this.database = new rds.DatabaseInstance(this, "VectorDatabase", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_17,
      }),
      // Use t3.micro for low cost - $9.5 per month
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      // Place in the VPC we created
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC, // Place in public subnet (temporary solution)
      },
      // Use credentials from environment variables for initial setup
      credentials: rds.Credentials.fromUsername(dbUsername, {
        // Note: Security - plaintest password used directly in CDK Construct meaning
        // could be exposed in CloudFormation templates. This is a consequence of taking
        // the password from the end user in CLI wizard, instead of setting up the database
        // and then providing the generated password to the user after the fact.
        password: cdk.SecretValue.unsafePlainText(dbPassword),
      }),
      // Database configuration
      parameterGroup: parameterGroup,
      securityGroups: [dbSecurityGroup],
      // Deletion protection enabled for development i.e. database can be deleted when redeployed
      // NOTE: This should be changed to true when moving to production, so database is not deleted on redeployment
      deletionProtection: false,
      // SECURITY NOTE: This is not recommended for production environment
      // but the RDS instance is being placed in a public subnet to enable Lambda access
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For easier cleanup
      publiclyAccessible: true,
    });

    // Create S3 bucket for image storage
    this.imageBucket = new s3.Bucket(this, "ImageBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For easier cleanup during development
      autoDeleteObjects: true, // Automatically delete objects when bucket is removed
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }), // Allow public access
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ["*"], // In production, restrict this to specific origins
          allowedHeaders: ["*"],
        },
      ],
    });

    // CONTINUE FROM HERE
    // Add policy directly to the bucket using addToResourcePolicy
    this.imageBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: "PublicReadGetObject",
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        actions: ["s3:GetObject"],
        resources: [
          this.imageBucket.bucketArn,
          this.imageBucket.arnForObjects("*"),
        ],
      })
    );
    /*
    // Add a bucket policy for public read access
    const bucketPolicy = new s3.BucketPolicy(this, 'ImageBucketPolicy', {
      bucket: this.imageBucket,
    });

    bucketPolicy.document.addStatements(
      new iam.PolicyStatement({
        sid: 'PublicReadGetObject',
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:GetObject'],
        resources: [this.imageBucket.arnForObjects('*')],
      })
    );
    */

    // Update the secret with the database endpoint after creation (i.e. update the host in secret)
    const secretAttachment = new secretsmanager.SecretTargetAttachment(
      this,
      "SecretRDSAttachment",
      {
        secret: this.databaseSecret,
        target: this.database,
      }
    );

    // Create outputs for cross-stack references
    // I.e. Other stacks can input the exportName parameter values using `Fn::ImportValue`.
    new cdk.CfnOutput(this, "DatabaseEndpoint", {
      value: this.database.dbInstanceEndpointAddress,
      description: "The endpoint of the RDS database",
      exportName: `${this.stackName}-DatabaseEndpoint`,
    });

    new cdk.CfnOutput(this, "DatabasePort", {
      value: this.database.dbInstanceEndpointPort,
      description: "The port of the RDS database",
      exportName: `${this.stackName}-DatabasePort`,
    });

    new cdk.CfnOutput(this, "DatabaseSecretArn", {
      value: this.databaseSecret.secretArn,
      description: "The ARN of the database credentials secret",
      exportName: `${this.stackName}-DatabaseSecretArn`,
    });

    new cdk.CfnOutput(this, "VpcId", {
      value: this.vpc.vpcId,
      description: "The ID of the VPC",
      exportName: `${this.stackName}-VpcId`,
    });

    new cdk.CfnOutput(this, "ImageBucketName", {
      value: this.imageBucket.bucketName,
      description: "The name of the S3 bucket for image storage",
      exportName: `${this.stackName}-ImageBucketName`,
    });

    new cdk.CfnOutput(this, "ImageBucketArn", {
      value: this.imageBucket.bucketArn,
      description: "The ARN of the S3 bucket for image storage",
      exportName: `${this.stackName}-ImageBucketArn`,
    });
  }
}
