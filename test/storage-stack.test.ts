import * as cdk from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
import { StorageStack } from "../lib/storage-stack";

// Mock environment variables for testing
process.env.DB_USERNAME = "testuser";
process.env.DB_PASSWORD = "testpassword";
process.env.POSTGRES_DB_NAME = "testdb";

test("creates RDS instance and S3 bucket with correct configuration", () => {
  const app = new cdk.App();
  const stack = new StorageStack(app, "TestStorageStack");
  const template = Template.fromStack(stack);

  // Verify VPC is created
  template.resourceCountIs("AWS::EC2::VPC", 1);
  template.hasResourceProperties("AWS::EC2::VPC", {
    CidrBlock: Match.anyValue(),
    EnableDnsHostnames: true,
    EnableDnsSupport: true,
  });

  // Verify RDS instance is created
  template.resourceCountIs("AWS::RDS::DBInstance", 1);
  // Verify RDS instance configuration
  template.hasResourceProperties("AWS::RDS::DBInstance", {
    Engine: "postgres",
    EngineVersion: Match.stringLikeRegexp("17"),
    DBInstanceClass: "db.t4g.small",
    AllocatedStorage: "100",
    StorageType: "gp2",
    DeletionProtection: false,
    PubliclyAccessible: true,
  });

  // Verify that a security group is created
  template.resourceCountIs("AWS::EC2::SecurityGroup", 1);
  // Check for ingress rule within the security group definition
  template.hasResourceProperties("AWS::EC2::SecurityGroup", {
    SecurityGroupIngress: Match.arrayWith([
      Match.objectLike({
        CidrIp: "0.0.0.0/0",
        FromPort: 5432,
        ToPort: 5432,
        IpProtocol: "tcp",
      }),
    ]),
  });

  /*
  // Verify parameter group
  template.hasResourceProperties("AWS::RDS::DBParameterGroup", {
    Description: "Parameter group for PostgreSQL vector database",
    Family: Match.stringLikeRegexp("postgres17"),
    Parameters: {
      max_parallel_workers_per_gather: "4",
      work_mem: "16384",
      maintenance_work_mem: "128000",
    },
  });
  */

  // Verify Secrets Manager secret
  template.resourceCountIs("AWS::SecretsManager::Secret", 1);
  // Verify SecretTargetAttachment is created to update database endpoint in secret
  template.resourceCountIs("AWS::SecretsManager::SecretTargetAttachment", 1);
  template.hasResourceProperties(
    "AWS::SecretsManager::SecretTargetAttachment",
    {
      SecretId: {
        Ref: Match.stringLikeRegexp("DatabaseCredentials"),
      },
      TargetId: {
        Ref: Match.stringLikeRegexp("VectorDatabase"),
      },
      TargetType: "AWS::RDS::DBInstance",
    }
  );

  template.hasResourceProperties("AWS::S3::Bucket", {
    PublicAccessBlockConfiguration: {
      BlockPublicAcls: false,
      BlockPublicPolicy: false,
      IgnorePublicAcls: false,
      RestrictPublicBuckets: false,
    },
    /*
    CorsConfiguration: {
      CorsRules: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["GET", "POST", "PUT", "DELETE"],
          AllowedOrigins: ["*"],
        },
      ],
    },
    */
  });

  template.hasResourceProperties("AWS::S3::BucketPolicy", {
    PolicyDocument: {
      Statement: Match.arrayWith([
        Match.objectLike({
          Action: Match.arrayWith([
            "s3:PutBucketPolicy",
            "s3:GetBucket*",
            "s3:List*",
            "s3:DeleteObject*",
          ]),
          Effect: "Allow",
        }),
      ]),
      Version: "2012-10-17",
    },
  });

  // Verify CloudFormation outputs
  template.hasOutput("DatabaseEndpoint", {});
  template.hasOutput("DatabasePort", {});
  template.hasOutput("DatabaseSecretArn", {});
  template.hasOutput("VpcId", {});
  template.hasOutput("ImageBucketName", {});
  template.hasOutput("ImageBucketArn", {});
});

/*
test("throws error when DB_PASSWORD is not set", () => {
  // Clear the password environment variable
  const originalPassword = process.env.DB_PASSWORD;
  delete process.env.DB_PASSWORD;

  const app = new cdk.App();

  // Expect an error when creating the stack
  expect(() => {
    new StorageStack(app, "TestStorageStack");
  }).toThrow("DB_PASSWORD environment variable must be set");

  // Restore the environment variable
  process.env.DB_PASSWORD = originalPassword;
});
*/

test("creates public subnet configuration properly", () => {
  const app = new cdk.App();
  const stack = new StorageStack(app, "TestStorageStack");
  const template = Template.fromStack(stack);

  // Verify public subnets are created (should have at least 2 for high availability)
  const subnets = template.findResources("AWS::EC2::Subnet");
  expect(Object.keys(subnets).length).toBeGreaterThanOrEqual(2);

  // Verify route table association with internet gateway (indicating public subnet)
  template.resourceCountIs("AWS::EC2::InternetGateway", 1);
  // Check for at least one route with internet gateway
  const routes = template.findResources("AWS::EC2::Route");
  expect(Object.keys(routes).length).toBeGreaterThan(0);
  template.hasResourceProperties("AWS::EC2::Route", {
    DestinationCidrBlock: "0.0.0.0/0",
    GatewayId: {
      Ref: Match.stringLikeRegexp("DatabaseVPCIGW"),
    },
  });
});
