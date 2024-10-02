import { Connector } from "@runmorph/cdk";

import { ConnectionClient, AllConnectionsClient } from "./Connection";
import { ClientConnector } from "./Connector";
import { Session } from "./Session";
import { ConnectionIds } from "./types";
import { Adapter } from "./types/adapter";

export function Morph<
  A extends Adapter,
  C extends Connector<I>[],
  I extends string,
>(options: { database: { adapter: A }; connectors: C }): MorphClient<A, C, I> {
  return new MorphClient(options);
}

export class MorphClient<
  A extends Adapter,
  C extends Connector<I>[],
  I extends string,
> {
  database: {
    adapter: A;
  };
  _private: {
    connectors: C;
  };
  constructor(options: { database: { adapter: A }; connectors: C }) {
    this.database = options.database;
    this._private = { connectors: options.connectors };
  }

  connection(): AllConnectionsClient<A, C, I>;
  connection(
    params: ConnectionIds<I> | { sessionToken: string },
  ): ConnectionClient<A, C, I>;

  connection(
    params?: ConnectionIds<I> | { sessionToken: string },
  ): ConnectionClient<A, C, I> | AllConnectionsClient<A, C, I> {
    if (!params) {
      return new AllConnectionsClient(this);
    } else {
      return new ConnectionClient(this, params);
    }
  }

  session(): Session {
    return new Session(this);
  }

  connector(): ClientConnector<A, C, I> {
    return new ClientConnector(this);
  }
}
