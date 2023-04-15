import fs from "fs/promises";
import path from "path";

import inquirer from "inquirer";
import { exec, execSync } from "child_process";

import gitIgnore from "./templates/git-ignore.js";
import prettierrc from "./templates/prettierrc.js";
import lintstagedrc from "./templates/lintstagedrc.js";
import commitlintrc from "./templates/commitlintrc.js";
import { typescriptConfig, javascriptConfig } from "./templates/eslintrc.js";

interface Answers {
  projectName: string;
  packageManager: "npm" | "yarn" | "pnpm";
  typescript: "yes" | "no";
}

let projectDirectory: string;

const packageRunner = {
  npm: "npx",
  yarn: "yarn",
  pnpm: "pnpx",
};

async function main() {
  const questions = [
    {
      name: "projectName",
      message: "What is the name of your project?",
    },
    {
      name: "packageManager",
      message: "Which package manager do you want to use?",
      type: "list",
      choices: ["npm", "yarn", "pnpm"],
    },
    {
      name: "typescript",
      message: "Do you want to use typescript?",
      type: "list",
      choices: ["yes", "no"],
    },
  ];

  const answers = await inquirer.prompt<Answers>(questions);
  const useTypescript = answers.typescript === "yes";
  projectDirectory = path.resolve(process.cwd(), answers.projectName);

  initVite(answers, useTypescript);
  installDependencies(answers, useTypescript);
  initGit();
  initPrettier();
  initEslint(useTypescript);
  initHusky(answers.packageManager);
  initLintStaged();
  initCommitLint();
}

function initVite(answers: Answers, useTypescript: boolean) {
  execSync(
    `${answers.packageManager} create vite${
      answers.packageManager === "npm" ? "@latest" : ""
    } ${answers.projectName} ${
      answers.packageManager === "npm" ? "--" : ""
    } --template react${useTypescript ? "-ts" : ""}`
  );
  executeInProjectDirectory(`${answers.packageManager} install`, true);
}

function installDependencies(answers: Answers, useTypescript: boolean) {
  executeInProjectDirectory(
    `${answers.packageManager} ${
      answers.packageManager === "yarn" ? "add" : "install"
    } -D prettier eslint husky lint-staged @commitlint/cli @commitlint/config-conventional ${
      useTypescript
        ? "@typescript-eslint/parser @typescript-eslint/eslint-plugin"
        : ""
    }`,
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

function initHusky(packageManager: Answers["packageManager"]) {
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

main();
