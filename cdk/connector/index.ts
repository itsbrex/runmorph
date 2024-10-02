import { ConnectorClientOptions } from "@runmorph/cdk";
// @ts-ignore
import connector from "./connector";

export default function ConnectorFactory(options: ConnectorClientOptions) {
  if (options) {
    connector.setOptions(options);
  }
  return connector;
}
