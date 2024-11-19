import {
  ConnectorBundle,
  ResourceModelOperations,
  Awaitable,
  EitherDataOrError,
} from "@runmorph/cdk";

import { MorphClient } from "./Morph";
import { Adapter } from "./types/adapter";

export class ClientConnector<
  A extends Adapter,
  C extends ConnectorBundle<I, ResourceModelOperations>[],
  I extends string,
> {
  private morph: MorphClient<A, C>;

  constructor(morph: MorphClient<A, C>) {
    this.morph = morph;
  }

  retrieve<T extends I>(
    id: T
  ): Awaitable<EitherDataOrError<ConnectorBundle<T, ResourceModelOperations>>> {
    const connector = this.morph.𝙢_.connectors[id];

    if (!connector) {
      return {
        error: {
          code: "CONNECTOR::NOT_FOUND",
          message: `Connector '${id}' is not configured.`,
        },
      };
    }

    return {
      data: connector as unknown as ConnectorBundle<T, ResourceModelOperations>,
    };
  }
}
