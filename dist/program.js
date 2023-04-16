var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from "fs/promises";
import path from "path";
import { exec, execSync, spawn } from "child_process";
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
let projectDirectory;
const packageRunner = {
    npm: "npx",
    yarn: "yarn",
    pnpm: "pnpx",
};
export function run(options) {
    return __awaiter(this, void 0, void 0, function* () {
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
        const answers = yield inquirer.prompt(questions);
        const css = (options.css || answers.css);
        const packageManager = (options.packageManager ||
            answers.packageManager);
        const projectName = (options.name || answers.projectName);
        const useTypescript = options.typescript || answers.typescript === "yes";
        projectDirectory = path.resolve(process.cwd(), projectName);
        return initVite(packageManager, projectName, useTypescript, css, options);
    });
}
function initVite(packageManager, projectName, useTypescript, css, options) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            var _a;
            console.log(chalk.green("\nInitializing Vite..."));
            const vitePackage = packageManager === "npm" ? "vite@latest" : "vite";
            const npmTemplate = packageManager === "npm" ? "--" : "";
            const template = `react${useTypescript ? "-ts" : ""}`;
            const child = spawn(packageManager, [
                "create",
                vitePackage,
                projectName,
                npmTemplate,
                "--template",
                template,
            ].filter((it) => !!it), {
                stdio: ["inherit", "pipe", "inherit"],
            });
            let shouldLog = true;
            let viteOutput = [];
            (_a = child.stdout) === null || _a === void 0 ? void 0 : _a.on("data", (data) => {
                const output = data.toString();
                if (output.includes("Done. Now run:")) {
                    shouldLog = false;
                    viteOutput.push(output);
                }
                else if (shouldLog) {
                    console.log(data.toString());
                }
                else {
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
    });
}
function deleteViteBoilerPlate() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            fs.rm(path.resolve(projectDirectory, "src/App.tsx"));
            fs.rm(path.resolve(projectDirectory, "src/main.tsx"));
            fs.rm(path.resolve(projectDirectory, "src/App.css"));
            fs.rm(path.resolve(projectDirectory, "src/index.css"));
            yield fs.rm(path.resolve(projectDirectory, "src/assets/react.svg"));
            fs.rmdir(path.resolve(projectDirectory, "src/assets"));
            yield fs.rm(path.resolve(projectDirectory, "public/vite.svg"));
            fs.rmdir(path.resolve(projectDirectory, "public"));
        }
        finally {
            fs.writeFile(path.resolve(projectDirectory, "src/App.tsx"), AppTsx);
            fs.writeFile(path.resolve(projectDirectory, "src/main.tsx"), mainTsx);
        }
    });
}
function installOtherDependencies(useTypescript, packageManager, css, options) {
    const dependencies = [
        options.prettier && "prettier",
        options.eslint && "eslint",
        options.husky && "husky",
        options.lintStaged && "lint-staged",
        options.commitlint && "@commitlint/cli",
        options.commitlint && "@commitlint/config-conventional",
        options.stylelint && "stylelint",
        options.stylelint && "stylelint-config-standard",
        useTypescript && "@typescript-eslint/parser",
        useTypescript && "@typescript-eslint/eslint-plugin",
        css !== "none" && css,
    ].filter((dependency) => typeof dependency !== "boolean");
    executeInProjectDirectory(`${packageManager} ${packageManager === "yarn" ? "add" : "install"} -D ${dependencies.join(" ")}`, true, { stdio: "inherit" });
    console.log(chalk.blue("Installed other dependencies\n"));
    initDependencies(useTypescript, packageManager, options);
}
function initDependencies(useTypescript, packageManager, options) {
    console.log(chalk.green("Initializing other dependencies..."));
    initGit();
    if (options.prettier)
        initPrettier();
    if (options.eslint)
        initEslint(useTypescript);
    if (options.stylelint)
        initStylelint();
    if (options.husky)
        initHusky(packageManager);
    if (options.lintStaged)
        initLintStaged();
    if (options.commitlint)
        initCommitLint();
}
function initGit() {
    executeInProjectDirectory("git init");
    fs.writeFile(path.resolve(projectDirectory, ".gitignore"), gitIgnore);
}
function initPrettier() {
    fs.writeFile(path.resolve(projectDirectory, ".prettierrc.json"), prettierrc);
}
function initEslint(useTypescript) {
    fs.writeFile(path.resolve(projectDirectory, ".eslintrc.json"), useTypescript ? typescriptConfig : javascriptConfig);
    fs.writeFile(path.resolve(projectDirectory, ".eslintignore"), `node_modules
vite.config.${useTypescript ? "t" : "j"}s`);
}
function initStylelint() {
    fs.writeFile(path.resolve(projectDirectory, ".stylelintrc.json"), stylelintrc);
}
function initHusky(packageManager) {
    executeInProjectDirectory(`${packageRunner[packageManager]} husky install`);
    executeInProjectDirectory(`${packageRunner[packageManager]} husky add .husky/pre-commit "pnpm lint-staged"`);
    executeInProjectDirectory(`${packageRunner[packageManager]} husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'`);
}
function initLintStaged() {
    fs.writeFile(path.resolve(projectDirectory, ".lintstagedrc"), lintstagedrc);
}
function initCommitLint() {
    fs.writeFile(path.resolve(projectDirectory, ".commitlintrc.json"), commitlintrc);
}
function executeInProjectDirectory(command, sync = false, options) {
    if (sync) {
        execSync(command, Object.assign({ cwd: projectDirectory }, options));
    }
    else {
        exec(command, Object.assign({ cwd: projectDirectory }, options));
    }
}
