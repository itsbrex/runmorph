import {
  ConnectorBundle,
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
import { AuthorizeHadleParams, AuthorizeParams } from "./types";
import { Adapter } from "./types/adapter";
import { oautCallback } from "./utils/oauth";
import { WebhookRegistry } from "./WebhookRegistry";

export type MorphConfig<CA> = {
  database: { adapter: Adapter };
  connectors: CA;
  logger?: Logger;
};
export function Morph<
  TConnectorBundleArray extends ConnectorBundle<any, any, any, any, any>[],
>(
  options: MorphConfig<TConnectorBundleArray>
): MorphClient<TConnectorBundleArray> {
  return new MorphClient(options);
}

export class MorphClient<
  TConnectorBundleArray extends ConnectorBundle<any, any, any, any, any>[],
> {
  𝙢_: {
    connectors: ArrayToIndexedObject<TConnectorBundleArray, "id">;
    database: {
      adapter: Adapter;
    };
    logger?: Logger;
  };
  //public static instance: MorphClient<any>;
  constructor(options: MorphConfig<TConnectorBundleArray>) {
    this.𝙢_ = {
      database: options.database,
      connectors: options.connectors.reduce(
        (acc, connector) => {
          // @ts-expect-error: Index signature for type 'string' is implicitly defined
          acc[connector.id] = connector;
          return acc;
        },
        {} as ArrayToIndexedObject<TConnectorBundleArray, "id">
      ),
    };

    if (options.logger) {
      this.setLogger(options.logger);
    }

    /* if (!MorphClient.instance) {
      MorphClient.instance = this;
    }*/
  }

  webhooks(): WebhookRegistry<TConnectorBundleArray> {
    return WebhookRegistry.getInstance(this);
  }

  setLogger(logger: Logger): void {
    this.𝙢_.logger = logger;
    Object.keys(this.𝙢_.connectors).forEach((ci) =>
      this.𝙢_.connectors[ci as keyof typeof this.𝙢_.connectors].setLogger(
        logger
      )
    );
  }

  connections<I extends TConnectorBundleArray[number]["id"]>(
    params: ConnectionIds<I> | { sessionToken: string }
  ): ConnectionClient<
    ArrayToIndexedObject<TConnectorBundleArray, "id">[I],
    TConnectorBundleArray
  > {
    return new ConnectionClient(this, params);
  }

  sessions(): Session<
    Adapter,
    TConnectorBundleArray,
    TConnectorBundleArray[number]["id"]
  > {
    return new Session(this);
  }

  connectors(): ClientConnector<TConnectorBundleArray> {
    return new ClientConnector(this);
  }

  callbacks(type: "oauth"): {
    handle: (params: AuthorizeHadleParams) => Awaitable<
      EitherTypeOrError<{
        connection: ConnectionData;
        redirectUrl: string;
      }>
    >;
  } {
    return {
      oauth: {
        handle: (
          params: AuthorizeHadleParams
        ): Awaitable<
          EitherTypeOrError<{ connection: ConnectionData; redirectUrl: string }>
        > => oautCallback(this, { ...params, type: "oauth" }),
      },
    }[type];
  }
}
