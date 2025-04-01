import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import dotenv from "dotenv";
import { execCommand } from "../utils/execCommand.js";

// Load environment variables
dotenv.config();

export async function deployCommand(options: any) {
  // Check if initialized
  if (process.env.INITIALIZED !== "true") {
    console.log(chalk.red("Configuration not initialized. Please run:"));
    console.log(chalk.yellow("document-embedding init"));
    process.exit(1);
  }

  console.log(chalk.blue.bold("\n Document Embedding Pipeline - Deployment\n"));

  // Confirm deployment
  const { confirmDeploy } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmDeploy",
      message: "This will deploy infrastructure to your AWS account. Continue?",
      default: false,
    },
  ]);

  if (!confirmDeploy) {
    console.log(chalk.yellow("Deployment cancelled"));
    return;
  }

  // Deployment steps
  try {
    // 1. Check CDK is installed
    const cdkCheckSpinner = ora("Checking CDK installation...").start();
    try {
      await execCommand("cdk --version", true);
      cdkCheckSpinner.succeed("CDK is installed");
    } catch (error) {
      cdkCheckSpinner.fail("CDK is not installed");
      console.log(chalk.red("Please install AWS CDK:"));
      console.log(chalk.yellow("npm install -g aws-cdk"));
      process.exit(1);
    }

    // 2. Bootstrap CDK (if needed)
    console.log(chalk.yellow("\nBootstrapping CDK (if needed)..."));
    const bootstrapSpinner = ora("Running CDK bootstrap...").start();
    try {
      await execCommand("cdk bootstrap", true);
      bootstrapSpinner.succeed("CDK bootstrapped successfully");
    } catch (error) {
      bootstrapSpinner.fail("CDK bootstrap failed");
      console.error(chalk.red("Error:"), error);
      process.exit(1);
    }

    // 3. Deploy the stacks
    console.log(chalk.yellow("\nDeploying infrastructure stacks"));
    let stdout = "";
    let stderr = "";
    try {
      // Set the proper environment variables for the CDK process
      const output = await execCommand(
        "cdk deploy --all --require-approval never",
        true
      );
      stdout = output.stdout;
      stderr = output.stderr;
      console.log(chalk.yellow("\nInfastructure stacks deployed successfully"));
    } catch (error) {
      console.error(
        chalk.red("\nInfrastructure stack deployment failed. Error:"),
        error
      );
      process.exit(1);
    }

    // Display API Endpoint and API Key to user
    let apiEndpoint: string | null = null;
    let apiKeyId: string | null = null;
    const apiEndpointMatch = stderr.match(
      /ApiStack\.ApiEndpoint\s*=\s*(https:\/\/[^\s]+)/
    );
    if (apiEndpointMatch && apiEndpointMatch[1]) {
      apiEndpoint = apiEndpointMatch[1];
    }
    const apiKeyMatch = stderr.match(/ApiStack\.ApiKeyId\s*=\s*([a-z0-9]+)/);
    if (apiKeyMatch && apiKeyMatch[1]) {
      apiKeyId = apiKeyMatch[1];
    }
    console.log(
      chalk.white.yellow(
        "Before proceeding to use the SDK, please ensure that you have allowed access to Amazon Bedrock Foundation Models in the AWS console. Details of how to do so can be found in the README.md file associated with the CLI.\n"
      )
    );
    console.log(chalk.white.bold("API Information:"));
    console.log(chalk.white("API Endpoint:"), chalk.cyan(apiEndpoint));
    console.log(chalk.white("API Key ID:"), chalk.cyan(apiKeyId));
    console.log(
      chalk.white("\nUse this API key in your requests with the header:"),
      chalk.cyan("x-api-key")
    );

    // Generate SDK configuration (optional)
    console.log(
      chalk.white(
        "\n[NOTE: SDK YET TO BE DEVELOPED - THIS IS PLACEHOLDER] - To use the document embedding pipeline in your applications, configure the SDK:"
      )
    );
    console.log(
      chalk.yellow(`
import { DocumentEmbeddingClient } from 'document-embedding-sdk';

const client = new DocumentEmbeddingClient({
  endpoint: '${apiEndpoint || "YOUR_API_ENDPOINT"}',
  apiKey: '${apiKeyId || "YOUR_API_KEY"}'
});
      `)
    );
  } catch (error) {
    console.error(chalk.red("\nDeployment failed:"));
    console.error(
      chalk.red(error instanceof Error ? error.message : String(error))
    );
    process.exit(1);
  }
}
