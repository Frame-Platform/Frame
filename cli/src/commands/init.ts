import chalk from "chalk";
import ora from "ora";
import { displayWelcome } from "../utils/displayWelcome.js";
import { awsCredentialsQuestions } from "../questions/aws-credentials.js";
import { databaseQuestions } from "../questions/database.js";
import { saveConfig } from "../utils/config-manager.js";

export async function initCommand() {
  displayWelcome();

  try {
    // Get AWS credentials configuration
    console.log(chalk.yellow.bold("AWS Credentials Configuration:"));
    const aws = await awsCredentialsQuestions();

    // Get database configuration
    console.log(chalk.yellow.bold("\nDatabase Configuration:"));
    const postgres = await databaseQuestions();

    // Combine answers
    const config = {
      aws_access_key_id: aws.accessKeyId,
      aws_secret_access_key: aws.secretAccessKey,
      aws_region: aws.region,
      /*
      postgres_host: postgres.host,
      postgres_port: postgres.port,
      */
      postgres_user: postgres.user,
      postgres_password: postgres.password,
      postgres_db_name: postgres.dbName,
      // postgres_table_name: postgres.tableName,
      initialized: true,
      createdAt: new Date().toISOString(),
    };

    // Save configuration
    const spinner = ora("Saving configuration...").start();
    saveConfig(config);
    spinner.succeed("Configuration saved successfully");

    console.log(chalk.green.bold("\n✅ Initialization complete!"));
    console.log(chalk.gray("You can now run: document-embedding deploy"));
  } catch (error) {
    console.error(chalk.red.bold("\n❌ Initialization failed:"));
    console.error(
      chalk.red(error instanceof Error ? error.message : String(error))
    );
    process.exit(1);
  }
}
