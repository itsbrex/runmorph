export type Awaitable<T> = T | PromiseLike<T>;

export interface Connector {
  id: string;
  name: string;
  description: string;
  authorization: {
    type: "oauth2" | "apiKey";
    authorizeUrl: string;
    accessTokenUrl: string;
    configs: Array<{
      key: string;
      type: "text" | "select" | "multiselect" | "number";
      required: boolean;
      description: string;
      default?: string;
      options?: Array<{
        key: string;
        value: string;
      }>;
    }>;
  };
}

export interface AdapterConnection {
  id: string;
  connectorId: string;
  authorization: Record<string, any>;
  status: string;
}

export interface AdapterConnectionUpdateParams {
  status: string;
  authorization: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  };
}

export interface Adapter {
  /**
   * Creates a connection in the database and returns it.
   */
  createConnection(connection: AdapterConnection): Awaitable<AdapterConnection>;
  retrieveConnection(id: string): Awaitable<AdapterConnection | null>;
  updateConnection(
    id: string,
    params: Partial<AdapterConnectionUpdateParams>
  ): Awaitable<AdapterConnection>;
}
