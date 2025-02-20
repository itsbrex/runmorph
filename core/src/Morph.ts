import {
  ConnectorBundle,
  ConnectionIds,
  ArrayToIndexedObject,
  Logger,
  Awaitable,
  EitherTypeOrError,
  ConnectionData,
} from "@runmorph/cdk/";

import { ConnectionClient } from "./Connection";
import { ClientConnector } from "./Connector";
import { SessionClient } from "./Session";
import { AuthorizeHadleParams } from "./types";
import { Adapter } from "./types/adapter";
import { oautCallback } from "./utils/oauth";
import { WebhookRegistry } from "./WebhookRegistry";

export type MorphConfig<CA> = {
  database: { adapter: Adapter };
  connectors: CA;
  logger?: Logger;
};
export function Morph<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TConnectorBundleArray extends ConnectorBundle<any, any, any, any, any, any>[],
>(
  options: MorphConfig<TConnectorBundleArray>
): MorphClient<TConnectorBundleArray> {
  return new MorphClient(options);
}

export class MorphClient<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TConnectorBundleArray extends ConnectorBundle<any, any, any, any, any, any>[],
> {
  m_: {
    connectors: ArrayToIndexedObject<TConnectorBundleArray, "id">;
    database: {
      adapter: Adapter;
    };
    logger?: Logger;
  };
  //public static instance: MorphClient<any>;
  constructor(options: MorphConfig<TConnectorBundleArray>) {
    this.m_ = {
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

  webhooks(options?: {
    tempInstance: boolean;
  }): WebhookRegistry<TConnectorBundleArray> {
    if (options?.tempInstance) {
      return WebhookRegistry.getInstance(this, options.tempInstance);
    }
    return WebhookRegistry.getInstance(this);
  }

  setLogger(logger: Logger): void {
    this.m_.logger = logger;
    Object.keys(this.m_.connectors).forEach((ci) =>
      this.m_.connectors[ci as keyof typeof this.m_.connectors].setLogger(
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

  sessions(): SessionClient<
    TConnectorBundleArray,
    TConnectorBundleArray[number]["id"]
  > {
    return new SessionClient(this);
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
