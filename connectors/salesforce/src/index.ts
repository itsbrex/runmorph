import { ConnectorBundle } from "@runmorph/cdk";

import connector from "./connector";


const resourceModelOperations = {
  
};

export default new ConnectorBundle({
  connector,
  resourceModelOperations,
}).init;
