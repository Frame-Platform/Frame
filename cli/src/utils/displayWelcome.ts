import chalk from "chalk";

export const displayWelcome = () => {
  console.log(
    chalk.blue.bold("\n📋 Frame Document Embedding Pipeline - Initialization\n")
  );
  console.log(
    chalk.yellow(
      "This CLI wizard will guide you through setting up the document embedding pipeline."
    )
  );
  console.log(
    chalk.yellow.bold(
      "**IMPORTANT**: Before proceeding, please ensure you're logged in to your AWS account."
    )
  );
  console.log(
    chalk.yellow(
      "You can log in through the AWS website or authenticate via the AWS CLI to access your resources."
    )
  );
  console.log(
    chalk.yellow(
      "You will need AWS credentials and RDS database information to complete the CLI setup.\n"
    )
  );
};
