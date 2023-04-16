import { Command, Option } from "commander";

import { run } from "./program.js";
import chalk from "chalk";

const program = new Command();

program
  .name("Create Vite + React app")
  .description("CLI to create a Vite + React app")
  .version("1.0.0");

program
  .command("create")
  .description("Creating a Vite + React app")
  .argument("[name]", "name of app")
  .addOption(
    new Option("-c, --css <type>", "type of css preprocessor to use").choices([
      "less",
      "sass",
      "stylus",
      "none",
    ])
  )
  .addOption(
    new Option(
      "-p, --package-manager <manager>",
      "package manager to use"
    ).choices(["pnpm", "yarn", "npm"])
  )
  .option("--no-typescript", "do not use typescript")
  .action((name, options) => {
    run({ name, ...options });
    process.on("exit", () => {
      console.log("\nDone. Now run:\n\n  cd " + name);
    });
  });

program.parse(process.argv);
