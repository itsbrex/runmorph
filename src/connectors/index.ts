import fs from "fs";
import path from "path";
import { Connector } from "../core/src/types";

const connectorFiles = fs
  .readdirSync(__dirname)
  .filter((file) => fs.statSync(path.join(__dirname, file)).isDirectory());

const connectors: Record<string, Promise<{ default: Connector }>> = {};

connectorFiles.forEach((file) => {
  connectors[file] = import(`./${file}`);
});

export default connectors;
