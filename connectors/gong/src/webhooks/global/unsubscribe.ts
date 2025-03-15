import { UnsubscribeFromGlobalEvent } from "@runmorph/cdk";

import GongGlobalEventMapper from "./mapper";

export default new UnsubscribeFromGlobalEvent({
  globalEventMapper: GongGlobalEventMapper,
  // Do nothing – we don't want to unsubscribe to global events that could impact other connection subscription
  handler: () => {},
});
