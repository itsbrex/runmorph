import { UnsubscribeFromGlobalEvent } from "@runmorph/cdk";

import HubSpotGlobalEventMapper from "./mapper";

export default new UnsubscribeFromGlobalEvent({
  globalEventMapper: HubSpotGlobalEventMapper,
  // Do nothing – we don't want to unsubscribe to global events that could impact other conenction subscribtion
  handler: () => {},
});
