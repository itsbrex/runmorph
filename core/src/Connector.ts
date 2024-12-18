import {
  ConnectorBundle,
  Awaitable,
  EitherDataOrError,
  ArrayToIndexedObject,
} from "@runmorph/cdk";

import { MorphClient } from "./Morph";

export class ClientConnector<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TConnectorBundleArray extends ConnectorBundle<any, any, any, any, any>[],
> {
  private morph: MorphClient<TConnectorBundleArray>;
  constructor(morph: MorphClient<TConnectorBundleArray>) {
    this.morph = morph;
  }

  retrieve<TConnectorId extends TConnectorBundleArray[number]["id"]>(
    id: TConnectorId
  ): Awaitable<
    EitherDataOrError<
      ArrayToIndexedObject<TConnectorBundleArray, "id">[TConnectorId]
    >
  > {
    const connector = this.morph.m_.connectors[id];

    if (!connector) {
      return {
        error: {
          code: "CONNECTOR::NOT_FOUND",
          message: `Connector '${id}' is not configured.`,
        },
      };
    }

    return {
      data: connector as ArrayToIndexedObject<
        TConnectorBundleArray,
        "id"
      >[TConnectorId],
    };
  }
}
