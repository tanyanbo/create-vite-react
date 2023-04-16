# Create Vite + React App CLI

Create Vite + React App is a command-line interface (CLI) tool that helps you quickly create a new Vite + React application with your preferred configurations. With this CLI, you can set up a new project using a chosen package manager, CSS preprocessor, and choose to include or exclude TypeScript.

### Features

- Supports npm, yarn, and pnpm package managers
- Supports Less, Sass, Stylus, and plain CSS preprocessors
- Option to include or exclude TypeScript
- Includes pre-configurations for:
  - Prettier
  - ESLint
  - Stylelint
  - Husky
  - Lint-staged
  - Commitlint

### Installation

This CLI tool requires Node.js (>=14.0.0) to run. To use this CLI, run the following commands:

```sh
git clone https://github.com/tanyanbo/create-vite-react.git
pnpm build
```

### Usage

To create a new Vite + React app, run the following command:

```sh
create-vite-react-app create [name]
```

Replace [name] with your desired project name.

#### Options

You can customize your project setup with the following options:

- `c, --css <type>`: Choose a CSS preprocessor (less, sass, stylus, none)
- `p, --package-manager <manager>`: Choose a package manager (pnpm, yarn, npm)
- `--no-typescript`: Do not use TypeScript

For example, to create a new Vite + React app with TypeScript, Sass, and yarn, run:

```sh
create-vite-react-app create my-app -c sass -p yarn
```
