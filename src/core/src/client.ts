import { Connector, Adapter } from "./types";
import { Connection } from "./connection";
import { encryptState, decryptState } from "./utils/encryption";
import axios from "axios";

export interface MorphClientParams<A extends Adapter, C extends Connector[]> {
  adapter: A;
  connectors: C;
  operations: string[];
}

export class MorphClient<A extends Adapter, C extends Connector[]> {
  private adapter: A;
  private connectors: C;
  private operations: string[];

  constructor({ adapter, connectors, operations }: MorphClientParams<A, C>) {
    this.adapter = adapter;
    this.connectors = connectors;
    this.operations = operations;
  }

  connector = {
    retrieve: (id: string) => {
      return this.findConnector(id);
    },
    list: () => {
      return this.connectors;
    },
  };

  connection = {
    create: async <T extends C[number]["id"]>({
      connectorId,
      config = {},
    }: {
      connectorId: T;
      config?: Record<string, string>;
    }): Promise<Connection<A, C>> => {
      const connector = this.findConnector(connectorId);
      this.validateConfig(connector, config);

      const connection = await this.adapter.createConnection({
        id: `foo_${Date.now()}`,
        connectorId,
        status: "pending",
        authorization: {
          type: connector.authorization.type,
        },
      });

      return new Connection({ morph: this, adaperConnection: connection });
    },

    retrieve: async (id: string) => {
      return this.adapter.retrieveConnection(id);
    },

    authorize: {
      oauth: async (code: string, state: string) => {
        const { connectionId } = decryptState(state);
        const connection = await this.connection.retrieve(connectionId);
        if (!connection) {
          throw new Error("Invalid connection id");
        }

        const connector = this.findConnector(connection.connectorId);
        this.validateOAuthConnector(connector);

        const { clientId, clientSecret } = this.getOAuthCredentials(
          connector.id
        );
        const callbackBaseUrl = this.getCallbackBaseUrl();

        const tokenResponse = await this.fetchOAuthToken(connector, {
          code,
          clientId,
          clientSecret,
          callbackBaseUrl,
        });

        if (tokenResponse.data.access_token) {
          return this.updateConnectionWithToken(
            connection.id,
            tokenResponse.data
          );
        }

        return this.adapter.updateConnection(connectionId, {
          status: "unauthorized",
        });
      },
    },
  };

  private findConnector(connectorId: string): Connector {
    const connector = this.connectors.find((c) => c.id === connectorId);
    if (!connector) {
      throw new Error(`Connector ${connectorId} not found`);
    }
    return connector;
  }

  private validateConfig(connector: Connector, config: Record<string, string>) {
    const requiredConfigs = connector.authorization.configs.filter(
      (c) => c.required
    );
    for (const requiredConfig of requiredConfigs) {
      if (!config[requiredConfig.key]) {
        throw new Error(`Missing required config: ${requiredConfig.key}`);
      }
    }
  }

  private validateOAuthConnector(connector: Connector) {
    if (connector.authorization.type !== "oauth2") {
      throw new Error("Invalid connector or authorization type.");
    }
  }

  private getOAuthCredentials(connectorId: string) {
    const clientId =
      process.env[`MORPH_${connectorId.toUpperCase()}_CLIENT_ID`];
    const clientSecret =
      process.env[`MORPH_${connectorId.toUpperCase()}_CLIENT_SECRET`];

    if (!clientId || !clientSecret) {
      throw new Error(
        `MORPH_${connectorId.toUpperCase()}_CLIENT_ID or MORPH_${connectorId.toUpperCase()}_CLIENT_SECRET missing.`
      );
    }

    return { clientId, clientSecret };
  }

  private getCallbackBaseUrl() {
    const callbackBaseUrl = process.env.MORPH_CALLBACK_BASE_URL;
    if (!callbackBaseUrl) {
      throw new Error("MORPH_CALLBACK_BASE_URL missing.");
    }
    return callbackBaseUrl;
  }

  private async fetchOAuthToken(
    connector: Connector,
    {
      code,
      clientId,
      clientSecret,
      callbackBaseUrl,
    }: {
      code: string;
      clientId: string;
      clientSecret: string;
      callbackBaseUrl: string;
    }
  ) {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${callbackBaseUrl}/${connector.id}/callback`,
    });

    return axios.post(
      connector.authorization.accessTokenUrl,
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
  }

  private async updateConnectionWithToken(
    connectionId: string,
    tokenData: any
  ) {
    return this.adapter.updateConnection(connectionId, {
      status: "authorized",
      authorization: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      },
    });
  }
}

export default function Morph<A extends Adapter, C extends Connector[]>(
  params: MorphClientParams<A, C>
) {
  return new MorphClient(params);
}

export { Adapter, Connector, Connection, encryptState, decryptState };
