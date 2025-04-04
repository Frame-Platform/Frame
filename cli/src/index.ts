#!/usr/bin/env node
import { Command } from "commander";
import { destroyCommand } from "./commands/destroy.js";
import { initCommand } from "./commands/init.js";
import { deployCommand } from "./commands/deploy.js";

import pkg from "../package.json" with { type: "json" };
const { version, description } = pkg;

const program = new Command();

program.name("document-embedding").description(description).version(version);

program
  .command("init")
  .description("Initialize the document embedding pipeline configuration")
  .action(initCommand);

program
  .command("deploy")
  .description("Deploy the document embedding pipeline to AWS")
  .option("-p, --profile <profile>", "AWS profile to use")
  .option("-r, --region <region>", "AWS region to deploy to")
  .action(deployCommand);

program
  .command('destroy')
  .description('Destroy all deployed infrastructure')
  .action(destroyCommand);

program.parse(process.argv);

