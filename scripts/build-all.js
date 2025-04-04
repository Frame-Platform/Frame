const { execSync } = require("child_process");
const path = require("path");
const ROOT_DIR = process.cwd();
const CLI_DIR = path.join(ROOT_DIR, "cli");
const LAMBDA_DIR = "./lambda";
const DIST_DIR = path.join(LAMBDA_DIR, "lambdaDist");
const lambdaDirectories = ["honoProxy", "ingestionLambda", "searchLambda"];

try {
  console.log("=== Setting up project environment ===");

  console.log("\nInstalling root project dependencies...");
  execSync("npm install", { stdio: "inherit", cwd: ROOT_DIR });
  console.log("--Root dependencies installed successfully\n");

  console.log("\nInstalling CLI dependencies...");
  execSync("npm install", { stdio: "inherit", cwd: CLI_DIR });
  console.log("--CLI dependencies installed successfully\n");

  console.log("\nBuilding CLI TypeScript files...");
  execSync("npm run build", { stdio: "inherit", cwd: CLI_DIR });
  console.log("--CLI built successfully\n");

  console.log("\nInstalling CLI globally...");
  execSync("npm link", { stdio: "inherit", cwd: CLI_DIR });
  console.log(
    "--CLI linked globally. You can now use 'document-embedding' commands\n"
  );

  execSync(`mkdir -p ${DIST_DIR}`);
  execSync(`rm -f ${DIST_DIR}/*`);

  console.log("Building Lambdas...");
  for (const dir of lambdaDirectories) {
    const srcDir = path.join(LAMBDA_DIR, dir);

    console.log(`--Building ${dir}...`);
    execSync(`npm --prefix ${srcDir} install`, { stdio: "inherit" });
    execSync(`npm --prefix ${srcDir} run build:lambda`, { stdio: "inherit" });
    execSync(`cp ${srcDir}/${dir}.zip ${DIST_DIR}`, { stdio: "inherit" });
    console.log(`--${dir} complete!`);
  }

  console.log("=== Build Process Complete ===");
  console.log(`
• Project dependencies installed
• CLI tool built and linked globally
• Lambda functions built and packaged

You can now use the following commands:

• document-embedding init   - Initialize configuration
• document-embedding deploy - Deploy infrastructure to AWS
• document-embedding destroy - Remove infrastructure from AWS

Please begin the initialization step by running document-embedding init
`);
} catch (e) {
  console.error("Build Failed");
  process.exit(1);
}
