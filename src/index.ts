import fs from "fs/promises";
import inquirer from "inquirer";
import chalk from "chalk";
import { exec, execSync } from "child_process";
import path from "path";
import gitIgnore from "./templates/git-ignore.js";

interface Answers {
  projectName: string;
  packageManager: "npm" | "yarn" | "pnpm";
  typescript: "yes" | "no";
}

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
  const projectDirectory = path.resolve(process.cwd(), answers.projectName);

  initializeVite(answers, projectDirectory);
  initializeGit(projectDirectory);
}

function initializeVite(answers: Answers, directory: string) {
  const useTypescript = answers.typescript === "yes";
  console.log(chalk.green("Creating Vite React project..."));
  execSync(
    `${answers.packageManager} create vite${
      answers.packageManager === "npm" ? "@latest" : ""
    } ${answers.projectName} ${
      answers.packageManager === "npm" ? "--" : ""
    } --template react${useTypescript ? "-ts" : ""}`
  );
  execSync(`${answers.packageManager} install`, { cwd: directory });
  console.log(chalk.green("Project created successfully!"));
}

function initializeGit(directory: string) {
  console.log(chalk.green("Initializing git repository..."));
  exec("git init", { cwd: directory }, () => {
    exec("touch .gitignore", { cwd: directory }, () => {
      fs.writeFile(path.resolve(directory, ".gitignore"), gitIgnore);
      console.log(chalk.green("Git repository initialized successfully!"));
    });
  });
}

main();
