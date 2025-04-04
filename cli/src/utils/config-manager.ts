import * as fs from "fs";
import * as path from "path";
import { envType } from "../types/envType.js";
import chalk from "chalk";

export const saveConfig = (envObject: envType) => {
  const envFilePath = path.resolve(process.cwd(), ".env");
  const envData = Object.entries(envObject)
    .map(([key, value]) => `${key.toUpperCase()}=${value}`)
    .join("\n");

  fs.writeFileSync(envFilePath, envData);
  console.log(
    chalk.green(".env file created/updated with your configurations.")
  );
};

export const addEnvironmentVariables = (
  envVars: Record<string, string>
): void => {
  const envFilePath = path.resolve(process.cwd(), ".env");

  let existingEnvData = "";
  if (fs.existsSync(envFilePath)) {
    existingEnvData = fs.readFileSync(envFilePath, "utf-8");
  }

  const existingEnvVars: Record<string, string> = {};
  existingEnvData
    .split("\n")
    .filter((line) => line.trim() !== "")
    .forEach((line) => {
      const [key, ...valueParts] = line.split("=");
      const value = valueParts.join("=");
      if (key) {
        existingEnvVars[key] = value;
      }
    });

  const updatedEnvVars = {
    ...existingEnvVars,
    ...Object.fromEntries(
      Object.entries(envVars).map(([key, value]) => [key.toUpperCase(), value])
    ),
  };

  const updatedEnvData = Object.entries(updatedEnvVars)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  fs.writeFileSync(envFilePath, updatedEnvData);
};
