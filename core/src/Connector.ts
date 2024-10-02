import { Connector } from "@runmorph/cdk";

import { MorphError } from "./Error";
import { MorphClient } from "./Morph";
import { Adapter } from "./types/adapter";
import { Awaitable, EitherDataOrError } from "./types/utils";

export class ClientConnector<
  A extends Adapter,
  C extends Connector<I>[],
  I extends string,
> {
  private morph: MorphClient<A, C, I>;

  constructor(morph: MorphClient<A, C, I>) {
    this.morph = morph;
  }

  list(): Awaitable<EitherDataOrError<C>> {
    const connectors = this.morph._private.connectors;
    return { data: connectors };
  }

  retrieve<T extends I>(id: T): Awaitable<EitherDataOrError<Connector<T>>> {
    const connector = this.morph._private.connectors.find(
      (c) => c.id === id,
    ) as Connector<T> | undefined;

    if (!connector) {
      return {
        error: new MorphError({
          code: "MORPH_CONNECTOR_NOT_FOUND",
          message: `Connector '${id}' is not configured.`,
        }),
      };
    }

    return {
      data: connector,
    };
  }
}
