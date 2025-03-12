import { UnsubscribeFromGlobalEvent } from "@runmorph/cdk";

import HubSpotGlobalEventMapper from "./mapper";

export default new UnsubscribeFromGlobalEvent({
  globalEventMapper: HubSpotGlobalEventMapper,
  handler: () => {},
});
