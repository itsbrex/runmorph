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
  A extends Adapter,
  CA extends ConnectorBundle<
    string,
    ResourceModelOperations,
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>>
  >[],
>(
  config: MorphConfig<A, CA>
): {
  morph: MorphClient<A, CA>;
  handlers: ReturnType<NextMorphHandlers>;
} {
  console.log("NextMorph – init", config);
  const morph = Morph(config);
  const handlers = NextMorphHandlers(morph);

  return {
    morph,
    handlers,
  };
}
