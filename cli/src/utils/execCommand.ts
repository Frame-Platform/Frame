import { spawn, SpawnOptions } from "child_process";
import * as path from "path";
import chalk from "chalk";
import { deploymentOutputs } from "../types/deploymentTypes.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to execute shell commands
export const execCommand = async (
  command: string,
  logOutput: boolean = false
): Promise<deploymentOutputs> => {
  return new Promise((resolve, reject) => {
    // Split the command into program and args
    const parts = command.split(" ");
    const program = parts[0];
    const args = parts.slice(1);

    // Create properly typed options object
    const options: SpawnOptions = {
      env: process.env,
      stdio: ["inherit", "pipe", "pipe"] as const,
    };

    // For CDK commands, set working directory to CDK app location
    if (program === "cdk") {
      options.cwd = path.resolve(__dirname, "../../../");
      //options.cwd = path.resolve(process.cwd(), "../../"); // NOTE: Path changed from ../
      console.log(chalk.dim(`Running CDK command in: ${options.cwd}`));
    }

    // Spawn the process with the options
    const childProcess = spawn(program, args, options);

    let stdout = "";
    let stderr = "";

    childProcess.stdout?.on("data", (data) => {
      const output = data.toString();
      stdout += output;
      // Show important CDK output only if logOutput is true
      if (logOutput) {
        logOutputs(output);
      }
    });

    childProcess.stderr?.on("data", (data) => {
      const output = data.toString();
      stderr += output;
      // Show important CDK output only if logOutput is true
      if (logOutput) {
        logOutputs(output);
      }
    });

    childProcess.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with exit code ${code}: ${stderr}`));
      }
    });
  });
};

// Function to log outputs
const logOutputs = (output: string): void => {
  if (output.includes("Outputs:")) {
    console.log("AWS Output:");
    console.log(chalk.dim(output.trim()));
  }
};
