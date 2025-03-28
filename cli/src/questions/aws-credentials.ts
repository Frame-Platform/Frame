import inquirer from "inquirer";

export const awsCredentialsQuestions = async () => {
  const aws = await inquirer.prompt([
    {
      type: "input",
      name: "accessKeyId",
      message: "Enter your AWS Access Key ID:",
      validate: (input: string) =>
        input.trim().length > 0 ? true : "Access Key ID is required",
    },
    {
      type: "password",
      name: "secretAccessKey",
      message: "Enter your AWS Secret Access Key:",
      mask: "*",
      validate: (input: string) =>
        input.trim().length > 0 ? true : "Secret Access Key is required",
    },
    {
      type: "list",
      name: "region",
      message: "Select an AWS region for deployment:",
      choices: [
        "us-east-1",
        "us-east-2",
        "us-west-1",
        "us-west-2",
        "af-south-1",
        "ap-east-1",
        "ap-south-2",
        "ap-southeast-3",
        "ap-southeast-5",
        "ap-southeast-4",
        "ap-south-1",
        "ap-northeast-3",
        "ap-northeast-2",
        "ap-southeast-1",
        "ap-southeast-2",
        "ap-southeast-7",
        "ap-northeast-1",
        "ca-central-1",
        "ca-west-1",
        "eu-central-1",
        "eu-west-1",
        "eu-west-2",
        "eu-south-1",
        "eu-west-3",
        "eu-south-2",
        "eu-north-1",
        "eu-central-2",
        "il-central-1",
        "mx-central-1",
        "me-south-1",
        "me-central-1",
        "sa-east-1",
      ],
      default: "us-east-1",
    },
  ]);

  return aws;
};
