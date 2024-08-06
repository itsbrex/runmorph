import {
  Adapter,
  Connector,
  MorphClient,
  MorphClientParams,
} from "./core/src/client";

function Morph(params: MorphClientParams<Adapter, Connector[]>) {
  return new MorphClient(params);
}

export { Morph };

/*import type { Adapter } from "./adapters/prisma-adapter";
import axios from "axios";

interface ConnectionUpadateParams {
  authorisation: {
    access_token: string;
  };
}

function encryptState(data: {
  connectionId: string;
  timestamp: number;
}): string {
  const encryptionKey = process.env.MORPH_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error("Missing MORPH_ENCRYPTION_KEY environment variable");
  }
  const crypto = require("crypto");
  const iv = crypto.randomBytes(16);
  const hash = crypto.createHash("sha256");
  hash.update(encryptionKey);
  const keyBuffer = hash.digest();
  const cipher = crypto.createCipheriv("aes-256-cbc", keyBuffer, iv);
  let encrypted = cipher.update(JSON.stringify(data));
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decryptState(encryptedState: string): {
  connectionId: string;
  timestamp: number;
} {
  const encryptionKey = process.env.MORPH_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error("Missing MORPH_ENCRYPTION_KEY environment variable");
  }
  const crypto = require("crypto");
  const [ivHex, encryptedDataHex] = encryptedState.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encryptedData = Buffer.from(encryptedDataHex, "hex");
  const hash = crypto.createHash("sha256");
  hash.update(encryptionKey);
  const keyBuffer = hash.digest();
  const decipher = crypto.createDecipheriv("aes-256-cbc", keyBuffer, iv);
  let decrypted = decipher.update(encryptedData);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return JSON.parse(decrypted.toString());
}

class Connection<A extends Adapter, C extends Connector[]> {
  private morph: MorphClient<A, C>;
  id: string;
  connectorId: string;
  config: Record<string, string>;
  status: "pending" | "authorized" = "pending";
  authorization: {
    type: "oauth2" | "apiKey";
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
  };
  getAuthorizationUrl: () => string | undefined;

  constructor({
    morph,
    id,
    connectorId,
    config,
  }: {
    id: string;
    connectorId: C[number]["id"];
    config: Record<string, string>;
    morph: MorphClient<A, C>;
  }) {
    this.morph = morph;
    this.connectorId = connectorId;
    this.status = "pending";
    this.authorization = {
      type: "apiKey",
    };
    const connector = this.morph.connectors.retrieve(this.connectorId);
    if (!connector) {
      throw new Error(`Connector ${this.connectorId} not found`);
    }

    this.config = config || {};
    this.id = id;

    this.authorization = {
      type: connector.authorization.type,
    };

    this.getAuthorizationUrl = () => {
      const operations = this.morph.operations;
      const connector = this.morph.connectors.retrieve(this.connectorId);
      if (!connector) {
        throw new Error(`Connector ${this.connectorId} not found`);
      }

      if (connector.authorization.type === "oauth2") {
        const clientID =
          process.env[`MORPH_${connectorId.toUpperCase()}_CLIENT_ID`];
        const clientSecret =
          process.env[`MORPH_${connectorId.toUpperCase()}_CLIENT_SECRET`];

        if (!clientID || !clientSecret) {
          throw new Error(
            `Missing clientID or clientSecret for connector ${this.connectorId}`
          );
        }

        const callbackUrl = `${process.env.MORPH_CALLBACK_BASE_URL}/${this.connectorId}/callback`;

        const state = encryptState({
          connectionId: this.id,
          timestamp: Date.now(),
        });

        const authorizeUrl = new URL(connector.authorization.authorizeUrl);
        authorizeUrl.searchParams.append("client_id", clientID);
        authorizeUrl.searchParams.append("redirect_uri", callbackUrl);
        authorizeUrl.searchParams.append("response_type", "code");
        authorizeUrl.searchParams.append("state", state);
        authorizeUrl.searchParams.append("scope", "crm.objects.contacts.read");

        return authorizeUrl.toString();
      }
    };
  }

  static async create({
    morph,
    connectorId,
    config,
  }: {
    connectorId: Connector[][number]["id"];
    config: Record<string, string>;
    morph: MorphClient<Adapter, Connector[]>;
  }): Promise<Connection<Adapter, Connector[]>> {
    const connection = new Connection({
      id: "foo" + Date.now(),
      morph,
      connectorId,
      config,
    });
    await connection.initialize();
    return connection;
  }

  private async initialize(): Promise<void> {
    const connector = this.morph.connectors.retrieve(this.connectorId);
    if (!connector) {
      throw new Error(`Connector ${this.connectorId} not found`);
    }

    await this.morph.adapter.createConnection({
      id: this.id,
      connectorId: this.connectorId,
      authorization: {
        type: connector.authorization.type,
      },
      status: "pending",
    });
  }

  static async retrieve(
    id: string,
    morph: MorphClient<Adapter, Connector[]>
  ): Promise<Connection<Adapter, Connector[]>> {
    const connectionData = await morph.adapter.retrieveConnection(id);
    if (!connectionData) throw new Error(`Connection ${id} not found`);

    return new Connection({
      morph,
      connectorId: connectionData.connectorId,
      config: {},
      id,
    });
  }
}

interface MorphClientParams<A extends Adapter, C extends Connector[]> {
  adapter: A;
  connectors: C;
  operations: string[];
}

export class MorphClient<A extends Adapter, C extends Connector[]> {
  connectors: {
    list: () => C;
    retrieve: (id: string) => Connector | undefined;
  };
  operations: string[];
  adapter: Adapter;
  connections: {
    create: (params: {
      connectorId: C[number]["id"];
      config?: Record<string, string>;
    }) => Promise<Connection<A, C>>;
    retrieve: (id: string) => Promise<Connection<A, C>>;
    athorizeOAuth2: (
      code: string,
      state: string
    ) => Promise<Connection<A, C> | undefined>;
  };

  constructor({ adapter, connectors, operations }: MorphClientParams<A, C>) {
    this.adapter = adapter;
    this.connectors = {
      list: () => connectors,
      retrieve: (id: string) =>
        connectors.find((connector) => connector.id === id),
    };
    this.operations = operations;

    this.connections = {
      athorizeOAuth2: async (code: string, state: string) => {
        const { connectionId, timestamp } = decryptState(state);
        const connection = await Connection.retrieve(
          connectionId,
          this as unknown as MorphClient<Adapter, Connector[]>
        );
        const connector = this.connectors.retrieve(connection.connectorId);
        if (!connector) {
          throw new Error(`Connector ${connection.connectorId} not found`);
        }
        if (connector.authorization.type === "oauth2") {
          const accessTokenUrl = connector.authorization.accessTokenUrl;
          const clientID =
            process.env[
              `MORPH_${connection.connectorId.toUpperCase()}_CLIENT_ID`
            ];
          const clientSecret =
            process.env[
              `MORPH_${connection.connectorId.toUpperCase()}_CLIENT_SECRET`
            ];

          if (!clientID || !clientSecret) {
            throw new Error(
              `Missing client ID or secret for connector ${connection.connectorId}`
            );
          }

          const tokenResponse = await axios.post(
            accessTokenUrl,
            new URLSearchParams({
              grant_type: "authorization_code",
              client_id: clientID,
              client_secret: clientSecret,
              redirect_uri: `${process.env.MORPH_CALLBACK_BASE_URL}/${connection.connectorId}/callback`,
              code: code,
            }),
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
          );

          const { access_token, refresh_token, expires_in } =
            tokenResponse.data;

          if (!access_token) {
            throw new Error("No access token returned");
          }

          const updatedConnection = await this.adapter.updateConnection(
            connection.id,
            {
              status: "authorized",
              authorization: {
                accessToken: access_token,
                refreshToken: refresh_token,
                expiresAt: new Date(Date.now() + expires_in * 1000),
              },
            }
          );

          console.log(
            "Access token obtained and connection updated",
            updatedConnection
          );
          return await Connection.retrieve(
            connection.id,
            this as unknown as MorphClient<Adapter, Connector[]>
          );
        }
      },
      create: async ({
        connectorId,
        config = {},
      }: {
        connectorId: C[number]["id"];
        config?: Record<string, string>;
      }) => {
        const connector = this.connectors.retrieve(connectorId);
        if (!connector) {
          throw new Error(`Connector ${connectorId} not found`);
        }

        const missingConfigs = connector.authorization.configs
          .filter((configItem) => configItem.required && !configItem.default)
          .filter(
            (requiredConfig) => !config.hasOwnProperty(requiredConfig.key)
          );

        if (missingConfigs.length > 0) {
          const missingKeys = missingConfigs
            .map((config) => config.key)
            .join(", ");
          throw new Error(`Missing required configuration(s): ${missingKeys}`);
        }

        return await Connection.create({
          connectorId,
          config,
          morph: this as unknown as MorphClient<Adapter, Connector[]>,
        });
      },
      retrieve: async (id: string) => {
        return await Connection.retrieve(
          id,
          this as unknown as MorphClient<Adapter, Connector[]>
        );
      },
    };
  }
}

export default function Morph(params: MorphClientParams<Adapter, Connector[]>) {
  return new MorphClient(params);
}

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
*/
