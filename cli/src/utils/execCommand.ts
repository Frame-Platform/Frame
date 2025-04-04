import { spawn, SpawnOptions } from "child_process";
import * as path from "path";
import chalk from "chalk";
import { deploymentOutputs } from "../types/deploymentTypes.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const execCommand = async (
  command: string,
  logOutput: boolean = false
): Promise<deploymentOutputs> => {
  return new Promise((resolve, reject) => {
    const parts = command.split(" ");
    const program = parts[0];
    const args = parts.slice(1);

    const options: SpawnOptions = {
      env: process.env,
      stdio: ["inherit", "pipe", "pipe"] as const,
    };

    if (program === "cdk") {
      options.cwd = path.resolve(__dirname, "../../../");
    }

    const childProcess = spawn(program, args, options);

    let stdout = "";
    let stderr = "";

    childProcess.stdout?.on("data", (data) => {
      const output = data.toString();
      stdout += output;
      if (logOutput) {
        logOutputs(output);
      }
    });

    childProcess.stderr?.on("data", (data) => {
      const output = data.toString();
      stderr += output;
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

const logOutputs = (output: string): void => {
  if (output.includes("Outputs:")) {
    console.log("AWS Output:");
    console.log(chalk.dim(output.trim()));
  }
};
