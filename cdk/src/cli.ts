#!/usr/bin/env node

console.log("Current working directory:", process.cwd());
console.log("__dirname:", __dirname);
console.log("Process arguments:", process.argv);

import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

function copyRecursiveSync(src: string, dest: string): void {
  const exists = fs.existsSync(src);
  const stats = exists ? fs.statSync(src) : null;
  const isDirectory = exists && stats ? stats.isDirectory() : false;
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName),
      );
    });
  } else if (exists) {
    fs.copyFileSync(src, dest);
  }
}

function createTempTsConfig(cwd: string): string {
  const originalTsConfigPath = path.join(cwd, "tsconfig.json");
  const tempTsConfigPath = path.join(cwd, "tsconfig.morph.json");

  const tsConfig = JSON.parse(fs.readFileSync(originalTsConfigPath, "utf8"));
  tsConfig.compilerOptions.rootDir = ".morph";
  tsConfig.include = [".morph/**/*.ts"];

  fs.writeFileSync(tempTsConfigPath, JSON.stringify(tsConfig, null, 2));
  return tempTsConfigPath;
}

function runTsc(cwd: string, configPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tscProcess = spawn(
      "npx",
      ["tsc", "--project", configPath, "--outDir", "./dist"],
      {
        cwd,
        stdio: "inherit",
        shell: true,
      },
    );

    tscProcess.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`tsc process exited with code ${code}`));
      }
    });
  });
}

async function build(): Promise<boolean> {
  const cwd = process.cwd();
  console.log("Starting build process...");
  console.log("Current working directory:", cwd);

  let tempTsConfigPath: string | null = null;

  try {
    // Clean .morph directory
    const morphDirPath = path.join(cwd, ".morph");
    if (fs.existsSync(morphDirPath)) {
      console.log("Cleaning existing .morph directory contents...");
      fs.readdirSync(morphDirPath).forEach((file) => {
        const curPath = path.join(morphDirPath, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          fs.rmSync(curPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(curPath);
        }
      });
    } else {
      console.log("Creating .morph directory...");
      fs.mkdirSync(morphDirPath);
    }

    // Clean dist directory
    const distDirPath = path.join(cwd, "dist");
    if (fs.existsSync(distDirPath)) {
      console.log("Cleaning existing dist directory contents...");
      fs.readdirSync(distDirPath).forEach((file) => {
        const curPath = path.join(distDirPath, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          fs.rmSync(curPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(curPath);
        }
      });
    } else {
      console.log("Creating dist directory...");
      fs.mkdirSync(distDirPath);
    }

    // Copy contents of src/ to .morph/
    const srcPath = path.join(cwd, "src");
    if (fs.existsSync(srcPath)) {
      console.log("Copying contents of src/ to .morph/...");
      copyRecursiveSync(srcPath, morphDirPath);
      console.log("Contents of src/ directory copied successfully to .morph/");
    } else {
      console.log("src/ directory not found. Skipping copy operation.");
    }

    // Copy contents of package's connector to .morph/
    const packageConnectorPath = path.join(__dirname, "..", "connector");
    if (fs.existsSync(packageConnectorPath)) {
      console.log("Copying contents of package's connector to .morph/...");
      copyRecursiveSync(packageConnectorPath, morphDirPath);
      console.log(
        "Contents of package's connector directory copied successfully to .morph/connector/",
      );
    } else {
      console.log(
        "Package's connector directory not found. Skipping copy operation.",
      );
    }

    // Create temporary tsconfig
    console.log("Creating temporary tsconfig.morph.json...");
    tempTsConfigPath = createTempTsConfig(cwd);

    // Run tsc with temporary tsconfig
    console.log("Running tsc with temporary tsconfig...");
    await runTsc(cwd, tempTsConfigPath);

    console.log("Build completed successfully.");
    return true;
  } catch (error) {
    console.error("Build failed:", (error as Error).message);
    return false;
  } finally {
    // Clean up temporary tsconfig
    if (tempTsConfigPath && fs.existsSync(tempTsConfigPath)) {
      console.log("Cleaning up temporary tsconfig.morph.json...");
      fs.unlinkSync(tempTsConfigPath);
    }

    // Clean up .morph directory contents
    console.log("Cleaning up .morph directory contents...");
    const morphDirPath = path.join(cwd, ".morph");
    if (fs.existsSync(morphDirPath)) {
      fs.readdirSync(morphDirPath).forEach((file) => {
        const curPath = path.join(morphDirPath, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          fs.rmSync(curPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(curPath);
        }
      });
    }
  }
}

if (require.main === module) {
  console.log("CLI script is being run directly");

  build()
    .then((success) => {
      console.log("Build function returned:", success);
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Unhandled error in build function:", error);
      process.exit(1);
    });
} else {
  console.log("CLI script is being imported as a module");
}

export { build };
