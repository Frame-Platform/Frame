import * as cdk from "aws-cdk-lib";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as kms from "aws-cdk-lib/aws-kms";
import { Construct } from "constructs";
import * as dotenv from "dotenv";

dotenv.config();

export class StorageStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance;
  public readonly vpc: ec2.Vpc;
  public readonly databaseSecret: secretsmanager.Secret;
  public readonly imageBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dbUsername = process.env.POSTGRES_USER || "postgres";
    const dbPassword = process.env.POSTGRES_PASSWORD || "fallback";
    const dbName = process.env.POSTGRES_DB_NAME || "postgres";

    this.vpc = new ec2.Vpc(this, "DatabaseVPC", {
      subnetConfiguration: [
        {
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      "DatabaseSecurityGroup",
      {
        vpc: this.vpc,
        description: "Security Group for Vector Database",
        allowAllOutbound: true,
      }
    );

    dbSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.POSTGRES,
      "Allow PostgreSQL access from anywhere (TEMPORARY)"
    );

    this.databaseSecret = new secretsmanager.Secret(
      this,
      "DatabaseCredentials",
      {
        secretName: `${id}-db-credentials`,
        description:
          "Username and password for the document embedding vector database",
        secretStringValue: cdk.SecretValue.unsafePlainText(
          JSON.stringify({
            username: dbUsername,
            password: dbPassword,
          })
        ),
      }
    );

    const rdsEncryptionKey = new kms.Key(this, "RdsEncryptionKey", {
      description: "KMS key for RDS database encryption",
    });

    this.database = new rds.DatabaseInstance(this, "VectorDatabase", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_17,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.SMALL
      ),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      credentials: rds.Credentials.fromUsername(dbUsername, {
        password: cdk.SecretValue.unsafePlainText(dbPassword),
      }),
      databaseName: dbName,
      securityGroups: [dbSecurityGroup],
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      publiclyAccessible: true,
      storageEncrypted: true,
      storageEncryptionKey: rdsEncryptionKey,
      allocatedStorage: 20,
      maxAllocatedStorage: 1000,
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
    });

    this.imageBucket = new s3.Bucket(this, "ImageBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
    });

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
