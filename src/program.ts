import fs from "fs/promises";
import path from "path";
import { exec, execSync } from "child_process";

import inquirer from "inquirer";
import chalk from "chalk";

import gitIgnore from "./templates/git-ignore.js";
import prettierrc from "./templates/prettierrc.js";
import lintstagedrc from "./templates/lintstagedrc.js";
import commitlintrc from "./templates/commitlintrc.js";
import { typescriptConfig, javascriptConfig } from "./templates/eslintrc.js";
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

const dependencies = [
  "prettier",
  "eslint",
  "husky",
  "lint-staged",
  "@commitlint/cli",
  "@commitlint/config-conventional",
  "stylelint",
  "stylelint-config-standard",
];

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

  if (useTypescript) {
    dependencies.push("@typescript-eslint/parser");
    dependencies.push("@typescript-eslint/eslint-plugin");
  }
  if (answers.css !== "none") {
    dependencies.push(css);
  }

  projectDirectory = path.resolve(process.cwd(), projectName);

  initVite(packageManager, projectName, useTypescript);
  installDependencies(packageManager);
  initGit();
  initPrettier();
  initEslint(useTypescript);
  initStylelint();
  initHusky(packageManager);
  initLintStaged();
  initCommitLint();
}

function initVite(
  packageManager: PackageManager,
  projectName: string,
  useTypescript: boolean
) {
  execSync(
    `${packageManager} create vite${
      packageManager === "npm" ? "@latest" : ""
    } ${projectName} ${packageManager === "npm" ? "--" : ""} --template react${
      useTypescript ? "-ts" : ""
    }`
  );
  executeInProjectDirectory(`${packageManager} install`, true);
  deleteViteBoilerPlate();
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

function installDependencies(packageManager: PackageManager) {
  executeInProjectDirectory(
    `${packageManager} ${
      packageManager === "yarn" ? "add" : "install"
    } -D ${dependencies.join(" ")}`,
    true
  );
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
    path.resolve(projectDirectory, ".eslintrc.json"),
    useTypescript ? typescriptConfig : javascriptConfig
  );
  fs.writeFile(
    path.resolve(projectDirectory, ".eslintignore"),
    `node_modules
commitlint.config.js
vite.config.ts`
  );
}

function initStylelint() {
  fs.writeFile(
    path.resolve(projectDirectory, ".stylelintrc.json"),
    stylelintrc
  );
}

function initHusky(packageManager: PackageManager) {
  executeInProjectDirectory(`${packageRunner[packageManager]} husky install`);
  executeInProjectDirectory(
    `${packageRunner[packageManager]} husky add .husky/pre-commit "pnpm lint-staged"`
  );
  executeInProjectDirectory(
    `${packageRunner[packageManager]} husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'`
  );
}

function initLintStaged() {
  fs.writeFile(path.resolve(projectDirectory, ".lintstagedrc"), lintstagedrc);
}

function initCommitLint() {
  fs.writeFile(
    path.resolve(projectDirectory, ".commitlintrc.json"),
    commitlintrc
  );
}

function executeInProjectDirectory(command: string, sync: boolean = false) {
  if (sync) {
    exec(command, { cwd: projectDirectory });
  } else {
    execSync(command, { cwd: projectDirectory });
  }
}