import chalk from "chalk";
import inquirer from "inquirer";
import { execCommand } from "../utils/execCommand.js";

export async function destroyCommand() {
  console.log(
    chalk.red.bold("\n Document Embedding Pipeline - Destroy Infrastructure\n")
  );
  console.log(
    chalk.red.bold("WARNING: This action is permanent and cannot be undone!")
  );

  const { destroyStack } = await inquirer.prompt([
    {
      type: "list",
      name: "destroyStack",
      message:
        "Would you like to destroy your current Document Embedding CDK stacks?",
      choices: ["Continue", new inquirer.Separator(), "Cancel"],
    },
  ]);

  if (destroyStack === "Cancel") {
    console.log(chalk.yellow("Operation cancelled. Returning to CLI."));
    return;
  }

  try {
    console.log(chalk.yellow("\nStarting infrastructure destruction...\n"));
    await execCommand(`cdk destroy --all --require-approval never --force`);
    console.log(
      chalk.green.bold("\n All infrastructure has been destroyed successfully!")
    );
  } catch (error) {
    console.error("Destruction failed:", error);
    console.log(
      chalk.yellow(
        "Some resources may still exist in your AWS account. Please check the AWS Console."
      )
    );
    console.log(
      chalk.yellow(
        "Note: Failure to destroy stacks may be due to deletion protection enabled in production for various pieces of infrastructure (like the RDS database). If you are sure you want to proceed with deletion of all stacks, this can be achieved manually in the AWS CloudFormation management console"
      )
    );
    process.exit(1);
  }
}
