import fs from "fs/promises";
import path from "path";
import { exec, execSync, spawn } from "child_process";

import inquirer from "inquirer";
import chalk from "chalk";

import gitIgnore from "./templates/git-ignore.js";
import prettierrc from "./templates/prettierrc.js";
import lintstagedrc from "./templates/lintstagedrc.js";
import commitlintrc from "./templates/commitlintrc.js";
import stylelintrc from "./templates/stylelintrc.js";
import mainTsx from "./templates/mainTsx.js";
import AppTsx from "./templates/AppTsx.js";
import type {
  Answers,
  CssPreprocessor,
  Options,
  PackageManager,
} from "./types/index.js";

let projectDirectory: string;

const packageRunner = {
  npm: "npx",
  yarn: "yarn",
  pnpm: "pnpx",
};

export async function run(options: Options) {
  console.log(chalk.green("Creating a Vite + React app..."));

  const questions = [
    !options.name && {
      name: "projectName",
      message: "What is the name of your project?",
      default: "vite-react-app",
    },
    !options.packageManager && {
      name: "packageManager",
      message: "Which package manager do you want to use?",
      type: "list",
      choices: ["pnpm", "yarn", "npm"],
    },
    !options.css && {
      name: "css",
      message: "Which css preprocessor do you want to use?",
      type: "list",
      choices: ["less", "sass", "stylus", "none"],
    },
    options.typescript || {
      name: "typescript",
      message: "Do you want to use typescript?",
      type: "list",
      choices: ["yes", "no"],
    },
  ].filter((question) => typeof question === "object");

  const answers = await inquirer.prompt<Answers>(questions);
  const css = (options.css || answers.css) as CssPreprocessor;
  const packageManager = (options.packageManager ||
    answers.packageManager) as PackageManager;
  const projectName = (options.name || answers.projectName) as string;
  const useTypescript = options.typescript || answers.typescript === "yes";

  projectDirectory = path.resolve(process.cwd(), projectName);

  return initVite(packageManager, projectName, useTypescript, css, options);
}

async function initVite(
  packageManager: PackageManager,
  projectName: string,
  useTypescript: boolean,
  css: CssPreprocessor,
  options: Options,
) {
  return new Promise<string[]>((resolve) => {
    console.log(chalk.green("\nInitializing Vite..."));

    const vitePackage = packageManager === "npm" ? "vite@latest" : "vite";
    const npmTemplate = packageManager === "npm" ? "--" : "";
    const template = `react${useTypescript ? "-ts" : ""}`;

    const child = spawn(
      packageManager,
      [
        "create",
        vitePackage,
        projectName,
        npmTemplate,
        "--template",
        template,
      ].filter((it) => !!it),
      {
        stdio: ["inherit", "pipe", "inherit"],
      },
    );

    let shouldLog = true;
    const viteOutput: string[] = [];
    child.stdout?.on("data", (data) => {
      const output = data.toString();
      if (output.includes("Done. Now run:")) {
        shouldLog = false;
        viteOutput.push(output);
      } else if (shouldLog) {
        console.log(data.toString());
      } else {
        viteOutput.push(output);
      }
    });

    child.on("close", () => {
      console.log(chalk.green("Initialized Vite\n"));
      console.log(chalk.blue("Installing dependencies"));
      executeInProjectDirectory(`${packageManager} install`, true, {
        stdio: "inherit",
      });
      deleteViteBoilerPlate();
      installOtherDependencies(useTypescript, packageManager, css, options);
      resolve(viteOutput);
    });
  });
}

async function deleteViteBoilerPlate() {
  try {
    fs.rm(path.resolve(projectDirectory, "src/App.tsx"));
    fs.rm(path.resolve(projectDirectory, "src/main.tsx"));
    fs.rm(path.resolve(projectDirectory, "src/App.css"));
    fs.rm(path.resolve(projectDirectory, "src/index.css"));
    await fs.rm(path.resolve(projectDirectory, "src/assets/react.svg"));
    fs.rmdir(path.resolve(projectDirectory, "src/assets"));
    await fs.rm(path.resolve(projectDirectory, "public/vite.svg"));
    fs.rmdir(path.resolve(projectDirectory, "public"));
  } finally {
    fs.writeFile(path.resolve(projectDirectory, "src/App.tsx"), AppTsx);
    fs.writeFile(path.resolve(projectDirectory, "src/main.tsx"), mainTsx);
  }
}

function installOtherDependencies(
  useTypescript: boolean,
  packageManager: PackageManager,
  css: CssPreprocessor,
  options: Options,
) {
  const dependencies = [
    options.prettier && "prettier",
    options.husky && "husky",
    options.lintStaged && "lint-staged",
    options.commitlint && "@commitlint/cli",
    options.commitlint && "@commitlint/config-conventional",
    options.stylelint && "stylelint",
    options.stylelint && "stylelint-config-standard",
    css !== "none" && css,
  ].filter((dependency) => typeof dependency !== "boolean");

  executeInProjectDirectory(
    `${packageManager} ${packageManager === "yarn" ? "add" : "install"
    } -D ${dependencies.join(" ")}`,
    true,
    { stdio: "inherit" },
  );
  console.log(chalk.blue("Installed other dependencies\n"));
  initDependencies(useTypescript, packageManager, options);
}

function initDependencies(
  useTypescript: boolean,
  packageManager: PackageManager,
  options: Options,
) {
  console.log(chalk.green("Initializing other dependencies..."));
  initGit();
  if (options.prettier) initPrettier();
  if (options.eslint) initEslint(useTypescript);
  if (options.stylelint) initStylelint();
  if (options.husky) initHusky(packageManager);
  if (options.lintStaged) initLintStaged();
  if (options.commitlint) initCommitLint();
}

function initGit() {
  executeInProjectDirectory("git init");
  fs.writeFile(path.resolve(projectDirectory, ".gitignore"), gitIgnore);
}

function initPrettier() {
  fs.writeFile(path.resolve(projectDirectory, ".prettierrc.json"), prettierrc);
}

function initEslint(useTypescript: boolean) {
  fs.writeFile(
    path.resolve(projectDirectory, ".eslintignore"),
    `node_modules
vite.config.${useTypescript ? "t" : "j"}s`,
  );
}

function initStylelint() {
  fs.writeFile(
    path.resolve(projectDirectory, ".stylelintrc.json"),
    stylelintrc,
  );
}

function initHusky(packageManager: PackageManager) {
  executeInProjectDirectory(
    `${packageRunner[packageManager]} husky install`,
    true,
  );
  executeInProjectDirectory(
    `${packageRunner[packageManager]} husky add .husky/pre-commit "pnpm lint-staged"`,
    true,
  );
  executeInProjectDirectory(
    `${packageRunner[packageManager]} husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'`,
    true,
  );
}

function initLintStaged() {
  fs.writeFile(path.resolve(projectDirectory, ".lintstagedrc"), lintstagedrc);
}

function initCommitLint() {
  fs.writeFile(
    path.resolve(projectDirectory, ".commitlintrc.json"),
    commitlintrc,
  );
}

function executeInProjectDirectory(
  command: string,
  sync: boolean = false,
  options?: Parameters<typeof exec>[1] | Parameters<typeof execSync>[1],
) {
  if (sync) {
    execSync(command, { cwd: projectDirectory, ...options });
  } else {
    exec(command, { cwd: projectDirectory, ...options });
  }
}
