import { PackageManager } from "../types/index.js";

export default function (packageManager: PackageManager) {
  return `{
  "src/**/*.{js,jsx,ts,tsx}": ["${packageManager} lint", "prettier --write"],
  "src/**/*.{css,sass,scss,less,stylus}": ["stylelint", "prettier --write"]
}`;
}
