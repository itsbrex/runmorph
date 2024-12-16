import { ConnectorBundle } from "@runmorph/cdk";

import connectorDef from "./connector";

export const connector = new ConnectorBundle({
  connector: connectorDef,
  resourceModelOperations: {},
  webhookOperations: {},
});
