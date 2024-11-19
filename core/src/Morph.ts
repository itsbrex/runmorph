import {
  ConnectorBundle,
  ResourceModelOperations,
  ConnectionIds,
  ArrayToIndexedObject,
  Logger,
  Awaitable,
  EitherTypeOrError,
  ConnectionData,
} from "@runmorph/cdk/";

import { ConnectionClient, AllConnectionsClient } from "./Connection";
import { ClientConnector } from "./Connector";
import { Session } from "./Session";
import { AuthorizeParams } from "./types";
import { Adapter } from "./types/adapter";
import { oautCallback } from "./utils/oauth";

export type MorphConfig<A, CA> = {
  database: { adapter: A };
  connectors: CA;
  logger?: Logger;
};
export function Morph<
  A extends Adapter,
  CA extends ConnectorBundle<I, ResourceModelOperations>[],
  I extends string,
>(options: MorphConfig<A, CA>): MorphClient<A, CA> {
  return new MorphClient(options);
}

export class MorphClient<
  A extends Adapter,
  CA extends ConnectorBundle<string, ResourceModelOperations>[],
> {
  𝙢_: {
    connectors: ArrayToIndexedObject<CA, "id">;
    database: {
      adapter: A;
    };
    logger?: Logger;
  };
  constructor(options: MorphConfig<A, CA>) {
    this.𝙢_ = {
      database: options.database,
      connectors: options.connectors.reduce(
        (acc, connector) => {
          // @ts-expect-error: Index signature for type 'string' is implicitly defined
          acc[connector.id] = connector;
          return acc;
        },
        {} as ArrayToIndexedObject<CA, "id">
      ),
    };

    if (options.logger) {
      this.setLogger(options.logger);
    }
  }

  setLogger(logger: Logger): void {
    this.𝙢_.logger = logger;
    Object.keys(this.𝙢_.connectors).forEach((ci) =>
      this.𝙢_.connectors[ci as keyof typeof this.𝙢_.connectors].setLogger(
        logger
      )
    );
  }

  connections(): AllConnectionsClient<A, CA, CA[number]["id"]>;
  connections<I extends CA[number]["id"]>(
    params: ConnectionIds<I> | { sessionToken: string }
  ): ConnectionClient<A, CA, I>;

  connections<I extends CA[number]["id"]>(
    params?: ConnectionIds<I> | { sessionToken: string }
  ):
    | ConnectionClient<A, CA, I>
    | AllConnectionsClient<A, CA, CA[number]["id"]> {
    if (!params) {
      return new AllConnectionsClient(this);
    } else {
      return new ConnectionClient(this, params);
    }
  }
  sessions(): Session<A, CA, CA[number]["id"]> {
    return new Session(this);
  }

  connectors(): ClientConnector<A, CA, CA[number]["id"]> {
    return new ClientConnector(this);
  }

  callbacks(
    params: AuthorizeParams
  ): Awaitable<
    EitherTypeOrError<{ connection: ConnectionData; redirectUrl: string }>
  > {
    return oautCallback(this, params);
  }
}
