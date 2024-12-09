import type {
  Adapter,
  ConnectorBundle,
  MorphConfig,
  ResourceModelOperations,
  MorphResource,
  MorphClient,
  ResourceModelId,
  WebhookOperations,
  ResourceEvents,
} from "@runmorph/core";
import { Morph, resourceModelIds } from "@runmorph/core";

import { NextMorphHandlers } from "./morph-next-route";
export { NextMorphHandlers } from "./morph-next-route";
export { NextMorphClient } from "./morph-next-client";
export type { MorphResource, ResourceModelId };
export { resourceModelIds };
export function NextMorph<
  TConnectorBundleArray extends ConnectorBundle<any, any, any>[],
>(
  config: MorphConfig<TConnectorBundleArray>
): {
  morph: MorphClient<TConnectorBundleArray>;
  handlers: ReturnType<NextMorphHandlers>;
} {
  const morph = Morph(config);
  const handlers = NextMorphHandlers(morph);

  return {
    morph,
    handlers,
  };
}
