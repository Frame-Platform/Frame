import * as cdk from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
import { StorageStack } from "../lib/storage-stack";

process.env.DB_USERNAME = "testuser";
process.env.DB_PASSWORD = "testpassword";
process.env.POSTGRES_DB_NAME = "testdb";

test("creates RDS instance and S3 bucket with correct configuration", () => {
  const app = new cdk.App();
  const stack = new StorageStack(app, "TestStorageStack");
  const template = Template.fromStack(stack);

  template.resourceCountIs("AWS::EC2::VPC", 1);
  template.hasResourceProperties("AWS::EC2::VPC", {
    CidrBlock: Match.anyValue(),
    EnableDnsHostnames: true,
    EnableDnsSupport: true,
  });

  template.resourceCountIs("AWS::RDS::DBInstance", 1);
  template.hasResourceProperties("AWS::RDS::DBInstance", {
    Engine: "postgres",
    EngineVersion: Match.stringLikeRegexp("17"),
    DBInstanceClass: "db.t4g.small",
    AllocatedStorage: "100",
    StorageType: "gp2",
    DeletionProtection: false,
    PubliclyAccessible: true,
  });

  template.resourceCountIs("AWS::EC2::SecurityGroup", 1);
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

  template.resourceCountIs("AWS::SecretsManager::Secret", 1);
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

  template.hasOutput("DatabaseEndpoint", {});
  template.hasOutput("DatabasePort", {});
  template.hasOutput("DatabaseSecretArn", {});
  template.hasOutput("VpcId", {});
  template.hasOutput("ImageBucketName", {});
  template.hasOutput("ImageBucketArn", {});
});

test("creates public subnet configuration properly", () => {
  const app = new cdk.App();
  const stack = new StorageStack(app, "TestStorageStack");
  const template = Template.fromStack(stack);

  const subnets = template.findResources("AWS::EC2::Subnet");
  expect(Object.keys(subnets).length).toBeGreaterThanOrEqual(2);

  template.resourceCountIs("AWS::EC2::InternetGateway", 1);
  const routes = template.findResources("AWS::EC2::Route");
  expect(Object.keys(routes).length).toBeGreaterThan(0);
  template.hasResourceProperties("AWS::EC2::Route", {
    DestinationCidrBlock: "0.0.0.0/0",
    GatewayId: {
      Ref: Match.stringLikeRegexp("DatabaseVPCIGW"),
    },
  });
});
