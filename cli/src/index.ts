#!/usr/bin/env node
import { Command } from "commander";
import { destroyCommand } from "./commands/destroy.js";

// Import commands
import { initCommand } from "./commands/init.js";
import { deployCommand } from "./commands/deploy.js";


// Package info from package.json
import pkg from "../package.json" with { type: "json" };
const { version, description } = pkg;

// Create the CLI program
const program = new Command();

// Set up basic program info
program.name("document-embedding").description(description).version(version);

// Add commands
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

// Add this to your command definitions
program
  .command('destroy')
  .description('Destroy all deployed infrastructure')
  .action(destroyCommand);

// Parse arguments and execute
program.parse(process.argv);

