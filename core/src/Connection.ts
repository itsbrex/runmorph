import {
  connectionStatus,
  ConnectorBundle,
  ResourceModelOperations,
} from "@runmorph/cdk";
import type {
  ConnectionCreateParams,
  ConnectionAuthorizationData,
  ConnectionUpdateParams,
  ConnectionData,
  ConnectionIds,
  ConnectionProxyParams,
  ConnectionAuthorizationStoredData,
  EitherDataOrError,
  ErrorOrVoid,
  EitherTypeOrError,
  MorphError,
  ConnectionStatus,
  Logger,
  WebhookOperations,
  ResourceEvents,
  ArrayToIndexedObject,
  Settings,
} from "@runmorph/cdk";
import axios, { AxiosRequestConfig } from "axios";

import { MorphClient } from "./Morph";
import { ResourceClient } from "./Resource";
import type {
  Adapter,
  AdapterConnection,
  CreateAuthorizationParams,
} from "./types";
import { decryptJson, encryptJson } from "./utils/encryption";
import {
  generateAuthorizationUrl,
  getAuthorizationHeader,
} from "./utils/oauth";
import { WebhookClient } from "./Webhook";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ConnectorResourceModelId<
  C extends ConnectorBundle<any, any, any, any, any>,
> = keyof C["resourceModelOperations"];

function validateAuthorizationSettings(
  connector: ConnectorBundle<
    string,
    Settings,
    Settings,
    ResourceModelOperations,
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>, string>
  >,
  settings: Record<string, string>,
  strict: boolean = true
): EitherTypeOrError<{ settings: Record<string, string> }> {
  const finalSettings = { ...settings } as Record<string, any>;
  const missingSettings: string[] = [];

  for (const setting of connector.connector.auth.getSettingFields()) {
    if (!finalSettings[setting.key]) {
      if (setting.default !== undefined) {
        finalSettings[setting.key] = setting.default;
      } else if (setting.required) {
        missingSettings.push(setting.key);
      }
    }
  }

  if (strict && missingSettings.length > 0) {
    return {
      error: {
        code: "MORPH::CONNECTION::MISSING_REQUIRED_AUTHORIZATION_SETTINGS",
        message: `Missing required authorization settings: ${missingSettings.join(
          ", "
        )}`,
      },
    };
  }

  return { settings: finalSettings };
}

function connectionAdapterToConnectionData(
  adapterConnection: AdapterConnection
): ConnectionData {
  return {
    object: "connection",
    connectorId: adapterConnection.connectorId,
    ownerId: adapterConnection.ownerId,
    status: connectionStatus.includes(
      adapterConnection.status as ConnectionStatus
    )
      ? (adapterConnection.status as ConnectionStatus)
      : "unauthorized",
    operations: adapterConnection.operations,
    createdAt: adapterConnection.createdAt.toISOString(),
    updatedAt: adapterConnection.updatedAt.toISOString(),
  };
}

export class ConnectionClient<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  C extends ConnectorBundle<any, any, any, any, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CA extends ConnectorBundle<any, any, any, any, any>[],
> {
  //config: ConnectionClientType<A, C, I>;

  private type: "connectionSession" | "connection";
  private connectorId?: C["id"];
  private ownerId?: string;
  private sessionToken?: string;
  // private resourceModelIds?: keyof C["resourceModelOperations"];
  private morph: MorphClient<CA>;

  constructor(
    morph: MorphClient<CA>,
    params: (ConnectionIds<C["id"]> | { sessionToken: string }) & {}
  ) {
    this.morph = morph;

    if ("sessionToken" in params) {
      this.type = "connectionSession";
      this.sessionToken = params.sessionToken;
    } else {
      this.type = "connection";
      this.connectorId = params.connectorId;
      this.ownerId = params.ownerId;
    }
  }

  async create(
    params?: ConnectionCreateParams<[C]>
  ): Promise<EitherDataOrError<ConnectionData>> {
    const { data: connectionids, error } = this.getConnectionIds();
    if (error) return { error };
    const { ownerId, connectorId } = connectionids;
    this.morph.𝙢_.logger?.debug("Creating connection", {
      params,
      connectorId,
      ownerId,
    });

    const { data: connectorData, error: connectorError } = await this.morph
      .connectors()
      .retrieve(connectorId);
    if (connectorError) {
      this.morph.𝙢_.logger?.error("Failed to retrieve connector", {
        error: connectorError,
      });
      return { error: connectorError };
    }

    try {
      const connectionAdapter =
        await this.morph.𝙢_.database.adapter.createConnection({
          connectorId: connectorId,
          ownerId: ownerId,
          status: "unauthorized",
          operations: params?.operations || [],
          authorizationType: connectorData.connector.auth.type,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      this.morph.𝙢_.logger?.info("Connection created successfully", {
        connectorId,
        ownerId,
      });
      return { data: connectionAdapterToConnectionData(connectionAdapter) };
    } catch (e) {
      this.morph.𝙢_.logger?.error("Failed to create connection", { error: e });
      return {
        error: {
          code: "MORPH::CONNECTION::CREATION_FAILED",
          message: `Details : ${JSON.stringify(e)}`,
        },
      };
    }
  }

  async update(
    params?: ConnectionUpdateParams<[C]>
  ): Promise<EitherDataOrError<ConnectionData>> {
    const { data: connectionids, error } = this.getConnectionIds();
    if (error) return { error };
    const { ownerId, connectorId } = connectionids;
    this.morph.𝙢_.logger?.debug("Updating connection", {
      params,
      connectorId,
      ownerId,
    });

    const { data: currentConnection, error: retrieveError } =
      await this.retrieve();
    if (retrieveError) {
      this.morph.𝙢_.logger?.error("Failed to retrieve connection for update", {
        error: retrieveError,
      });
      return { error: retrieveError };
    }

    let updatedOperations = currentConnection.operations;
    if (params?.operations) {
      updatedOperations = params.operations;
    }

    try {
      const updatedConnectionAdapter =
        await this.morph.𝙢_.database.adapter.updateConnection(
          { connectorId, ownerId },
          { operations: updatedOperations, updatedAt: new Date() }
        );

      this.morph.𝙢_.logger?.info("Connection updated successfully", {
        connectorId,
        ownerId,
      });
      return {
        data: connectionAdapterToConnectionData(updatedConnectionAdapter),
      };
    } catch (e) {
      this.morph.𝙢_.logger?.error("Failed to update connection", { error: e });
      return {
        error: {
          code: "MORPH::CONNECTION::UPDATE_FAILED",
          message: `Failed to update connection: ${JSON.stringify(e)}`,
        },
      };
    }
  }

  async updateOrCreate(
    params?: ConnectionCreateParams<[C]>
  ): Promise<EitherDataOrError<ConnectionData>> {
    const { data: connectionids, error } = this.getConnectionIds();
    if (error) return { error };
    const { ownerId, connectorId } = connectionids;
    // First, try to retrieve the existing connection
    const { error: retrieveError } = await this.retrieve();

    if (retrieveError) {
      // If the connection doesn't exist, create a new one
      if (retrieveError.code === "MORPH::CONNECTION::NOT_FOUND") {
        return this.create(params);
      }
      // If there's a different error, return it
      return { error: retrieveError };
    }

    // If the connection exists, update it
    return this.update(params as ConnectionUpdateParams<[C]>);
  }

  async retrieve(): Promise<EitherDataOrError<ConnectionData>> {
    const { data: connectionids, error } = this.getConnectionIds();
    if (error) {
      this.morph.𝙢_.logger?.error(
        "isConnector : Failed to get connection ids",
        {
          error,
        }
      );
      return { error };
    }

    const { ownerId, connectorId } = connectionids;
    this.morph.𝙢_.logger?.debug("Retrieving connection", {
      connectorId,
      ownerId,
    });

    try {
      const connectionAdapter =
        await this.morph.𝙢_.database.adapter.retrieveConnection({
          connectorId,
          ownerId,
        });

      if (!connectionAdapter) {
        this.morph.𝙢_.logger?.warn("Connection not found", {
          connectorId,
          ownerId,
        });
        return {
          error: {
            code: "MORPH::CONNECTION::NOT_FOUND",
            message: `Connection with connectorId '${connectorId}' and ownerId '${ownerId}' couldn't be found.`,
          },
        };
      }

      this.morph.𝙢_.logger?.debug("Connection retrieved successfully", {
        connectorId,
        ownerId,
      });
      return { data: connectionAdapterToConnectionData(connectionAdapter) };
    } catch (e) {
      this.morph.𝙢_.logger?.error("Failed to retrieve connection", {
        error: e,
        connectorId,
        ownerId,
      });
      return {
        error: {
          code: "MORPH::CONNECTION::RETRIEVE_FAILED",
          message: `Details : ${JSON.stringify(e)}`,
        },
      };
    }
  }

  async delete(): Promise<ErrorOrVoid> {
    const { data: connectionids, error } = this.getConnectionIds();
    if (error) {
      this.morph.𝙢_.logger?.error(
        "isConnector : Failed to get connection ids",
        {
          error,
        }
      );
      return { error };
    }

    const { ownerId, connectorId } = connectionids;
    this.morph.𝙢_.logger?.debug("Deleting connection", {
      connectorId,
      ownerId,
    });

    try {
      await this.morph.𝙢_.database.adapter.deleteConnection({
        connectorId,
        ownerId,
      });
      this.morph.𝙢_.logger?.info("Connection deleted successfully", {
        connectorId,
        ownerId,
      });
      return {};
    } catch (e) {
      this.morph.𝙢_.logger?.error("Failed to delete connection", {
        error: e,
        connectorId,
        ownerId,
      });
      return {
        error: {
          code: "MORPH::CONNECTION::DELETION_FAILED",
          message: `Details : ${JSON.stringify(e)}`,
        },
      };
    }
  }

  async authorize(
    params?: CreateAuthorizationParams
  ): Promise<EitherDataOrError<ConnectionAuthorizationData>> {
    const { data: connectionids, error } = this.getConnectionIds();
    if (error) {
      this.morph.𝙢_.logger?.error(
        "isConnector : Failed to get connection ids",
        {
          error,
        }
      );
      return { error };
    }

    const { ownerId, connectorId } = connectionids;

    this.morph.𝙢_.logger?.debug("Starting authorization process", {
      connectorId,
      ownerId,
      params,
    });

    try {
      const redirectUrl = params?.redirectUrl;
      const scopes = params?.scopes || [];

      const connector = this.morph.𝙢_.connectors[connectorId] as C;
      this.morph.𝙢_.logger?.debug("Processing scopes", {
        initialScopes: scopes,
      });

      const connection =
        await this.morph.𝙢_.database.adapter.retrieveConnection({
          connectorId,
          ownerId,
        });

      if (!connection) {
        this.morph.𝙢_.logger?.error(
          "Connection not found during authorization",
          {
            connectorId,
            ownerId,
          }
        );
        return {
          error: {
            code: "MORPH::CONNECTION::NOT_FOUND",
            message: "Connection not found",
          },
        };
      }

      const operations = connection.operations || [];

      operations.forEach(function (operation) {
        const [resourceModelId, operationType] = operation.split("::");
        const entityOperations =
          connector.resourceModelOperations[
            resourceModelId as "genericContact"
          ];
        if (entityOperations) {
          const operationScopes =
            entityOperations[operationType as "retrieve"]?.scopes || [];
          scopes.push(
            ...operationScopes.filter(
              (scope: string) => !scopes.includes(scope)
            )
          );
        }
      });

      console.log("scope – after op", scopes);
      const { settings, error } = validateAuthorizationSettings(
        connector,
        params?.settings || {}
      );

      if (error) return { error };

      if (!connector.connector.auth.type.startsWith("oauth2")) {
        return {
          error: {
            code: "MORPH::CONNECTION::AUTH_TYPE_NOT_SUPPORTED",
            message: "Only 'oauth2' type authorization supported.",
          },
        };
      }

      const authorizationStoredData: ConnectionAuthorizationStoredData = {
        scopes: scopes,
        settings: settings,
      };

      await this.morph.𝙢_.database.adapter.updateConnection(
        {
          connectorId: connectorId,
          ownerId: ownerId,
        },
        {
          authorizationData: JSON.stringify(
            encryptJson(authorizationStoredData)
          ),
          updatedAt: new Date(),
        }
      );

      const authorizationUrl = generateAuthorizationUrl({
        connector: connector,
        ownerId: ownerId,
        scopes: scopes,
        redirectUrl,
      });

      const connectionAuthorizationData: ConnectionAuthorizationData = {
        object: "connectionAuthorization",
        connectorId: connectorId,
        ownerId: ownerId,
        status: "awaitingAuthorization", // TODO: not if connection already authorize. Need to connection.verify();
        scopes: scopes,
        settings: settings,
        authorizationUrl,
      };

      this.morph.𝙢_.logger?.info("Authorization process completed", {
        connectorId,
        ownerId,
        scopes,
        authorizationUrl,
      });
      return { data: decryptJson(connectionAuthorizationData) };
    } catch (error) {
      this.morph.𝙢_.logger?.error("Authorization process failed", {
        error,
        connectorId,
        ownerId,
      });
      if (error instanceof Error && "code" in error) {
        return { error: error as MorphError };
      } else {
        return {
          error: {
            code: "MORPH::UNKNOWN_ERROR",
            message: `Details : ${error}`,
          },
        };
      }
    }
  }

  async proxy<T = unknown>(
    params: ConnectionProxyParams
  ): Promise<EitherDataOrError<T>> {
    const { data: connectionids, error } = this.getConnectionIds();
    if (error) return { error };
    const { ownerId, connectorId } = connectionids;
    const tracer = this.morph.𝙢_.logger?.newTracer("connection::proxy", {
      request: { ...params },
    });
    tracer?.debug("Starting proxy request", {
      context: { connectorId, ownerId },
      ...params,
    });

    try {
      const { path, method, data, query = {}, headers = {} } = params;

      const { data: connectorData, error: connectorError } = await this.morph
        .connectors()
        .retrieve(connectorId);

      if (connectorError) {
        tracer?.closeTracer({ error: connectorError });
        return { error: connectorError };
      }

      const baseUrl = connectorData.connector.generateProxyBaseUrl({});
      if (!baseUrl) {
        const errorBaseUrl = {
          code: "CONNECTOR::BAD_CONFIGURATION" as const,
          message: `Proxy API base URL is not defined for the "${connectorId}" connector.`,
        };
        tracer?.closeTracer({ error: errorBaseUrl });
        return {
          error: errorBaseUrl,
        };
      }

      const url = new URL(path, baseUrl);

      // Add query parameters to the URL
      const queryString = this.serializeQuery(query);
      if (queryString) {
        url.search = queryString;
      }

      // Get the authorization header
      const authHeader = await getAuthorizationHeader(
        this.morph,
        connectorId,
        ownerId,
        this.morph.𝙢_.logger
      );

      // Prepare the request config
      const requestConfig: AxiosRequestConfig = {
        method,
        url: url.toString(),
        headers: {
          ...headers,
          ...(authHeader && { Authorization: authHeader }),
        },
        data,
      };

      const response = await axios(requestConfig);

      tracer?.closeTracer({ response: { data: response.data } });
      return { data: response.data };
    } catch (error) {
      tracer?.error("Proxy request failed", {
        error,
        connectorId,
        ownerId,
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
      });
      tracer?.closeTracer({ error });
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        if (statusCode) {
          switch (statusCode) {
            case 400:
              return {
                error: {
                  code: "MORPH::CONNECTION::PROXY::BAD_REQUEST",
                  message: error.response?.data
                    ? JSON.stringify(error.response?.data, null, 2)
                    : error.message,
                },
              };
            case 401:
              return {
                error: {
                  code: "MORPH::CONNECTION::PROXY::UNAUTHORIZED",
                  message: error.response?.data
                    ? JSON.stringify(error.response?.data, null, 2)
                    : error.message,
                },
              };
            case 403:
              return {
                error: {
                  code: "MORPH::CONNECTION::PROXY::FORBIDDEN",
                  message: error.response?.data
                    ? JSON.stringify(error.response?.data, null, 2)
                    : error.message,
                },
              };
            case 404:
              return {
                error: {
                  code: "MORPH::CONNECTION::PROXY::NOT_FOUND",
                  message: error.response?.data
                    ? JSON.stringify(error.response?.data, null, 2)
                    : error.message,
                },
              };
            case 429:
              return {
                error: {
                  code: "MORPH::CONNECTION::PROXY::RATE_LIMIT_EXCEEDED",
                  message: error.response?.data
                    ? JSON.stringify(error.response?.data, null, 2)
                    : error.message,
                },
              };
            case 500:
            case 502:
            case 503:
            case 504:
              return {
                error: {
                  code: "MORPH::CONNECTION::PROXY::SERVER_ERROR",
                  message: error.response?.data
                    ? JSON.stringify(error.response?.data, null, 2)
                    : error.message,
                },
              };
            default:
              // If it's not a recognized status code, fall through to the default error handling
              break;
          }
        }
        return {
          error: {
            code: "MORPH::CONNECTION::PROXY::REQUEST_FAILED",
            message: `${JSON.stringify(error.message)}`,
          },
        };
      }
      return {
        error: {
          code: "MORPH::CONNECTION::PROXY::REQUEST_FAILED",
          message: `Proxy request failed: ${JSON.stringify(error)}`,
        },
      };
    }
  }

  resources<LocalResourceModelId extends ConnectorResourceModelId<C>>(
    resourceModelId: LocalResourceModelId
  ): ResourceClient<C, CA, LocalResourceModelId> {
    return new ResourceClient(this.morph, this, resourceModelId);
  }

  isConnector<TConnectorIds extends CA[number]["id"]>(
    ...connectorIds: TConnectorIds[]
  ): ConnectionClient<
    ArrayToIndexedObject<CA, "id">[TConnectorIds],
    CA
  > | null {
    const { data: ids, error } = this.getConnectionIds();
    if (error) {
      this.morph.𝙢_.logger?.error(
        "isConnector : Failed to get connection ids",
        {
          error,
        }
      );
      return null;
    }
    if (connectorIds.includes(ids.connectorId)) {
      return this as unknown as ConnectionClient<
        ArrayToIndexedObject<CA, "id">[TConnectorIds],
        CA
      >;
    } else {
      return null;
    }
  }

  isOwner(...ownerIds: string[]): ConnectionClient<C, CA> | null {
    const { data: ids, error } = this.getConnectionIds();
    if (error) {
      this.morph.𝙢_.logger?.error(
        "isConnector : Failed to get connection ids",
        {
          error,
        }
      );
      return null;
    }
    if (ownerIds.includes(ids.ownerId)) {
      return this as unknown as ConnectionClient<C, CA>;
    } else {
      return null;
    }
  }

  getConnectionIds(): EitherDataOrError<{
    connectorId: C["id"];
    ownerId: string;
  }> {
    switch (this.type) {
      case "connection":
        return {
          data: {
            connectorId: this.connectorId!,
            ownerId: this.ownerId!,
          },
        };
      case "connectionSession": {
        const { data, error } = this.morph
          .sessions()
          .verify(this.sessionToken!);
        if (error) return { error };
        return {
          data: {
            connectorId: data.connection.connectorId,
            ownerId: data.connection.ownerId,
          },
        };
      }
    }
  }

  private serializeQuery(
    query: Record<string, unknown>,
    prefix: string = ""
  ): string {
    const queryParts: string[] = [];

    const encode = (key: string, value: unknown): string =>
      `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;

    const buildQuery = (obj: unknown, parentKey: string = ""): void => {
      if (obj === null || obj === undefined) {
        return;
      }
      if (typeof obj === "object" && !Array.isArray(obj)) {
        Object.keys(obj as Record<string, unknown>).forEach((key) => {
          const value = (obj as Record<string, unknown>)[key];
          const newKey = parentKey ? `${parentKey}[${key}]` : key;
          buildQuery(value, newKey);
        });
      } else if (Array.isArray(obj)) {
        queryParts.push(
          `${encodeURIComponent(parentKey)}=${obj
            .map((v) => encodeURIComponent(String(v)))
            .join(",")}`
        );
      } else {
        queryParts.push(encode(parentKey, obj));
      }
    };

    buildQuery(query, prefix);

    return queryParts.join("&");
  }

  webhooks(): WebhookClient<C, CA> {
    console.log("CORE_LOAD_WEBOOK");
    return new WebhookClient(this.morph, this);
  }
}

export class AllConnectionsClient<
  C extends ConnectorBundle<
    I,
    Settings,
    Settings,
    ResourceModelOperations,
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>, string>
  >[],
  I extends string,
> {
  private morph: MorphClient<C>;

  constructor(morph: MorphClient<C>) {
    this.morph = morph;
  }
}
