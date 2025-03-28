import { execSync } from "child_process";
import path from "path";

const WORKING_DIR = "./lambda";
const LAYER_DIR = path.join(WORKING_DIR, "layers");
const lambdaDirectories = ["honoProxy", "ingestionLambda", "searchLambda"];
const layerDirectories = [
  "aws-sdk-s3",
  "dotenv",
  "honoProxyLayer",
  "pg",
  // "sharp",
  "zod",
];

const distPath = path.join(WORKING_DIR, "lambdaDist");

try {
  execSync(`mkdir -p ${distPath}`);
  execSync(`rm -f ${distPath}/*`);

  console.log("Building Lambdas...");
  for (const dir of lambdaDirectories) {
    const srcDir = path.join(WORKING_DIR, dir);

    console.log(`--Building ${dir}...`);
    execSync(`npm --prefix ${srcDir} run build:lambda`, { stdio: "inherit" });
    execSync(`cp ${srcDir}/${dir}.zip ${distPath}`, { stdio: "inherit" });
    console.log(`--${dir} complete!`);
  }

  console.log("Building Layers...");
  for (const dir of layerDirectories) {
    console.log(`--Building ${dir} layer...`);
    const scriptPath = path.join(LAYER_DIR, dir, "script.sh");
    execSync(`bash ${LAYER_DIR}/${dir}/script.sh`, {
      stdio: "inherit",
    });
    console.log(`--${dir} layer complete!`);
  }
} catch (e) {
  console.error("Build Failed");
  process.exit(1);
}
