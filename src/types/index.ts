export type PackageManager = "npm" | "yarn" | "pnpm";
export type CssPreprocessor = "less" | "sass" | "stylus" | "none";

export interface Answers {
  projectName?: string;
  packageManager?: PackageManager;
  css?: CssPreprocessor;
  typescript?: "yes" | "no";
}

export interface Options {
  name?: string;
  packageManager?: PackageManager;
  css?: CssPreprocessor;
  typescript?: boolean;
}
