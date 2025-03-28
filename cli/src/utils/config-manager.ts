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
