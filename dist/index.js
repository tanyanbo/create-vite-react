var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Command, Option } from "commander";
import { run } from "./program.js";
const program = new Command();
program
    .name("Create Vite + React app")
    .description("CLI to create a Vite + React app")
    .version("1.0.0");
program
    .command("create")
    .description("Creating a Vite + React app")
    .argument("[name]", "name of app")
    .addOption(new Option("-c, --css <type>", "type of css preprocessor to use").choices([
    "less",
    "sass",
    "stylus",
    "none",
]))
    .addOption(new Option("-p, --package-manager <manager>", "package manager to use").choices(["pnpm", "yarn", "npm"]))
    .option("--no-typescript", "do not use typescript")
    .option("--no-prettier", "do not use prettier")
    .option("--no-eslint", "do not use eslint")
    .option("--no-stylelint", "do not use stylelint")
    .option("--no-commitlint", "do not use commitlint")
    .option("--no-lint-staged", "do not use lint staged")
    .option("--no-husky", "do not use husky")
    .action((name, options) => __awaiter(void 0, void 0, void 0, function* () {
    let viteOutput = yield run(Object.assign({ name }, options));
    const output = viteOutput.filter((line) => {
        return !line.includes("Progress");
    });
    try {
        output[1] = output[1].replace(/[\r\n].*install[\r\n]/, "\n");
    }
    finally {
        process.on("exit", () => {
            console.log(`${output.join("")}`);
        });
    }
}));
program.parse(process.argv);
