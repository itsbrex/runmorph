#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { generateIcons } from "./commands/generate";

const program = new Command();

program
  .name("@runmorph/iconify")
  .description("CLI tool to generate React icon components from SVGs")
  .version("0.1.0");

program
  .command("generate")
  .description("Generate React icon components from SVGs")
  .option(
    "-s, --source <path>",
    "Source directory containing SVG files",
    "./src/components/icons/.source"
  )
  .option(
    "-t, --target <path>",
    "Target directory for generated components",
    "./src/components/icons"
  )
  .action(async (options) => {
    try {
      await generateIcons(options);
    } catch (error) {
      console.error(
        chalk.red("Error:"),
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      process.exit(1);
    }
  });

program.parse(process.argv);
