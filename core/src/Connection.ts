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
  ConnectorEntityIds,
  Awaitable,
  EitherDataOrError,
  ErrorOrVoid,
  EitherTypeOrError,
  MorphError,
  ConnectionStatus,
  Logger,
  WebhookOperations,
  ResourceEvents,
} from "@runmorph/cdk";
import type { ResourceModelId } from "@runmorph/resource-models";
import axios, { AxiosRequestConfig } from "axios";

import { MorphClient } from "./Morph";
import { ResourceClient } from "./Resource";
import type {
  AuthorizeParams,
  Adapter,
  AdapterConnection,
  CreateAuthorizationParams,
} from "./types";
import { decryptJson, encryptJson } from "./utils/encryption";
import {
  generateAuthorizationUrl,
  getAuthorizationHeader,
  oautCallback,
} from "./utils/oauth";
import { WebhookClient } from "./Webhook";

function validateAuthorizationSettings(
  connector: ConnectorBundle<
    string,
    ResourceModelOperations,
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>>
  >,
  settings: Record<string, string>,
  strict: boolean = true
): EitherTypeOrError<{ settings: Record<string, string> }> {
  const finalSettings = { ...settings };
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

type ConnectionClientBase<
  A extends Adapter,
  C extends ConnectorBundle<
    string,
    ResourceModelOperations,
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>>
  >[],
> = {
  morph: MorphClient<A, C>;
};

type ConnectionClientConnection<
  A extends Adapter,
  C extends ConnectorBundle<
    string,
    ResourceModelOperations,
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>>
  >[],
  I extends C[number]["id"],
> = ConnectionClientBase<A, C> & {
  type: "connection";
  connectorId: I;
  ownerId: string;
  sessionToken?: never;
};

type ConnectionClientSession<
  A extends Adapter,
  C extends ConnectorBundle<
    string,
    ResourceModelOperations,
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>>
  >[],
> = ConnectionClientBase<A, C> & {
  type: "connectionSession";
  sessionToken: string;
  connectorId?: never;
  ownerId?: never;
};

type ConnectionClientType<
  A extends Adapter,
  C extends ConnectorBundle<
    string,
    ResourceModelOperations,
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>>
  >[],
  I extends C[number]["id"],
> = ConnectionClientConnection<A, C, I> | ConnectionClientSession<A, C>;

export class ConnectionClient<
  A extends Adapter,
  C extends ConnectorBundle<
    string,
    ResourceModelOperations,
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>>
  >[],
  I extends C[number]["id"],
> {
  config: ConnectionClientType<A, C, I>;
  connectorId: I;
  ownerId: string;
  resourceModelIds: ConnectorEntityIds<C, I>;
  logger?: Logger;
  //TODO POC to improve
  authHeader?: string;

  constructor(
    morph: MorphClient<A, C>,
    params: ConnectionIds<I> | { sessionToken: string }
  ) {
    this.logger = morph.𝙢_.logger;
    if ("sessionToken" in params) {
      this.config = {
        type: "connectionSession",
        morph,
        sessionToken: params.sessionToken,
      };
      const ids = this._getConnectionIds();
      this.connectorId = ids.data!.connectorId;
      this.ownerId = ids.data!.ownerId;
    } else {
      this.connectorId = params.connectorId;
      this.ownerId = params.ownerId;
      this.config = {
        type: "connection",
        morph,
        connectorId: params.connectorId,
        ownerId: params.ownerId,
      };
    }

    this.resourceModelIds = Object.keys(
      morph.𝙢_.connectors[this.connectorId].resourceModelOperations
    ) as unknown as ConnectorEntityIds<C, I>;
  }

  async create(
    params?: ConnectionCreateParams<C>
  ): Promise<EitherDataOrError<ConnectionData>> {
    const { data: ids, error } = this._getConnectionIds();
    if (error) {
      return { error };
    }
    return this._create(ids.connectorId, ids.ownerId, params);
  }

  async update(
    params?: ConnectionUpdateParams<C>
  ): Promise<EitherDataOrError<ConnectionData>> {
    const { data: ids, error } = this._getConnectionIds();
    if (error) return { error };
    return this._update(ids.connectorId, ids.ownerId, params);
  }

  async updateOrCreate(
    params?: ConnectionCreateParams<C>
  ): Promise<EitherDataOrError<ConnectionData>> {
    const { data: ids, error } = this._getConnectionIds();
    if (error) return { error };
    return this._updateOrCreate(ids.connectorId, ids.ownerId, params);
  }

  async retrieve(): Promise<EitherDataOrError<ConnectionData>> {
    const { data: ids, error } = this._getConnectionIds();
    if (error) return { error };
    return this._retrieve(ids.connectorId, ids.ownerId);
  }

  async delete(): Promise<ErrorOrVoid> {
    const { data: ids, error } = this._getConnectionIds();
    if (error) return { error };
    return this._delete(ids.connectorId, ids.ownerId);
  }

  async authorize(
    params?: CreateAuthorizationParams
  ): Promise<EitherDataOrError<ConnectionAuthorizationData>> {
    return this._authorize(this.connectorId, this.ownerId, params);
  }

  async proxy<T = unknown>(
    params: ConnectionProxyParams
  ): Promise<EitherDataOrError<T>> {
    console.log("proxy – params", params);
    const { data: ids, error } = this._getConnectionIds();
    console.log("proxy – ids", ids);
    if (error) return { error };
    return this._proxy<T>(ids.connectorId, ids.ownerId, params);
  }

  resources<LocalResourceModelId extends ConnectorEntityIds<C, I>>(
    resourceModelId: LocalResourceModelId
  ): ResourceClient<A, C, I, LocalResourceModelId> {
    return this._resources(resourceModelId);
  }

  isConnector<ConnectorIds extends I>(
    ...connectorIds: ConnectorIds[]
  ): ConnectionClient<A, C, ConnectorIds> | null {
    if (connectorIds.includes(this.connectorId as ConnectorIds)) {
      return this as unknown as ConnectionClient<A, C, ConnectorIds>;
    } else {
      return null;
    }
  }

  isOwner(...ownerIds: string[]): ConnectionClient<A, C, I> | null {
    if (ownerIds.includes(this.ownerId)) {
      return this as unknown as ConnectionClient<A, C, I>;
    } else {
      return null;
    }
  }

  private async _create(
    connectorId: C[number]["id"],
    ownerId: string,
    params?: ConnectionCreateParams<C>
  ): Promise<EitherDataOrError<ConnectionData>> {
    this.logger?.debug("Creating connection", { params, connectorId, ownerId });

    const { data: connectorData, error: connectorError } =
      await this.config.morph.connectors().retrieve(connectorId);
    if (connectorError) {
      this.logger?.error("Failed to retrieve connector", {
        error: connectorError,
      });
      return { error: connectorError };
    }

    try {
      const connectionAdapter =
        await this.config.morph.𝙢_.database.adapter.createConnection({
          connectorId: connectorId,
          ownerId: ownerId,
          status: "unauthorized",
          operations: params?.operations || [],
          authorizationType: connectorData.connector.auth.type,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      this.logger?.info("Connection created successfully", {
        connectorId,
        ownerId,
      });
      return { data: connectionAdapterToConnectionData(connectionAdapter) };
    } catch (e) {
      this.logger?.error("Failed to create connection", { error: e });
      return {
        error: {
          code: "MORPH::CONNECTION::CREATION_FAILED",
          message: `Details : ${JSON.stringify(e)}`,
        },
      };
    }
  }

  private async _update(
    connectorId: C[number]["id"],
    ownerId: string,
    params?: ConnectionUpdateParams<C>
  ): Promise<EitherDataOrError<ConnectionData>> {
    this.logger?.debug("Updating connection", { params, connectorId, ownerId });

    const { data: currentConnection, error: retrieveError } =
      await this.retrieve();
    if (retrieveError) {
      this.logger?.error("Failed to retrieve connection for update", {
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
        await this.config.morph.𝙢_.database.adapter.updateConnection(
          { connectorId, ownerId },
          { operations: updatedOperations, updatedAt: new Date() }
        );

      this.logger?.info("Connection updated successfully", {
        connectorId,
        ownerId,
      });
      return {
        data: connectionAdapterToConnectionData(updatedConnectionAdapter),
      };
    } catch (e) {
      this.logger?.error("Failed to update connection", { error: e });
      return {
        error: {
          code: "MORPH::CONNECTION::UPDATE_FAILED",
          message: `Failed to update connection: ${JSON.stringify(e)}`,
        },
      };
    }
  }

  private async _retrieve(
    connectorId: C[number]["id"],
    ownerId: string
  ): Promise<EitherDataOrError<ConnectionData>> {
    this.logger?.debug("Retrieving connection", { connectorId, ownerId });

    try {
      const connectionAdapter =
        await this.config.morph.𝙢_.database.adapter.retrieveConnection({
          connectorId,
          ownerId,
        });

      if (!connectionAdapter) {
        this.logger?.warn("Connection not found", { connectorId, ownerId });
        return {
          error: {
            code: "MORPH::CONNECTION::NOT_FOUND",
            message: `Connection with connectorId '${connectorId}' and ownerId '${ownerId}' couldn't be found.`,
          },
        };
      }

      this.logger?.debug("Connection retrieved successfully", {
        connectorId,
        ownerId,
      });
      return { data: connectionAdapterToConnectionData(connectionAdapter) };
    } catch (e) {
      this.logger?.error("Failed to retrieve connection", {
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

  private _getConnectionIds(): EitherDataOrError<{
    connectorId: I;
    ownerId: string;
  }> {
    switch (this.config.type) {
      case "connection":
        return {
          data: {
            connectorId: this.config.connectorId,
            ownerId: this.config.ownerId,
          },
        };
      case "connectionSession": {
        const { data, error } = this.config.morph
          .sessions()
          .verify(this.config.sessionToken);
        if (error) return { error };
        return {
          data: {
            connectorId: data.connection.connectorId as I,
            ownerId: data.connection.ownerId,
          },
        };
      }
    }
  }

  private async _updateOrCreate(
    connectorId: C[number]["id"],
    ownerId: string,
    params?: ConnectionUpdateParams<C>
  ): Promise<EitherDataOrError<ConnectionData>> {
    // First, try to retrieve the existing connection
    const { error: retrieveError } = await this._retrieve(connectorId, ownerId);

    if (retrieveError) {
      // If the connection doesn't exist, create a new one
      if (retrieveError.code === "MORPH::CONNECTION::NOT_FOUND") {
        return this._create(connectorId, ownerId, params);
      }
      // If there's a different error, return it
      return { error: retrieveError };
    }

    // If the connection exists, update it
    return this._update(
      connectorId,
      ownerId,
      params as ConnectionUpdateParams<C>
    );
  }

  async _delete(
    connectorId: C[number]["id"],
    ownerId: string
  ): Promise<ErrorOrVoid> {
    this.logger?.debug("Deleting connection", { connectorId, ownerId });

    try {
      await this.config.morph.𝙢_.database.adapter.deleteConnection({
        connectorId,
        ownerId,
      });
      this.logger?.info("Connection deleted successfully", {
        connectorId,
        ownerId,
      });
      return {};
    } catch (e) {
      this.logger?.error("Failed to delete connection", {
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

  async _authorize(
    connectorId: I,
    ownerId: string,
    params?: CreateAuthorizationParams
  ): Promise<EitherDataOrError<ConnectionAuthorizationData>> {
    this.logger?.debug("Starting authorization process", {
      connectorId,
      ownerId,
      params,
    });

    try {
      const redirectUrl = params?.redirectUrl;
      const scopes = params?.scopes || [];

      const connector = this.config.morph.𝙢_.connectors[connectorId];
      this.logger?.debug("Processing scopes", { initialScopes: scopes });

      const connection =
        await this.config.morph.𝙢_.database.adapter.retrieveConnection({
          connectorId,
          ownerId,
        });

      if (!connection) {
        this.logger?.error("Connection not found during authorization", {
          connectorId,
          ownerId,
        });
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
          connector.resourceModelOperations[resourceModelId as ResourceModelId];
        if (entityOperations) {
          const operationScopes =
            entityOperations[operationType as "retrieve"]?.scopes || [];
          scopes.push(
            ...operationScopes.filter((scope) => !scopes.includes(scope))
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

      await this.config.morph.𝙢_.database.adapter.updateConnection(
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

      this.logger?.info("Authorization process completed", {
        connectorId,
        ownerId,
        scopes,
        authorizationUrl,
      });
      return { data: decryptJson(connectionAuthorizationData) };
    } catch (error) {
      this.logger?.error("Authorization process failed", {
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

  private _resources<LocalEneityId extends ConnectorEntityIds<C, I>>(
    entityId: LocalEneityId
  ): ResourceClient<A, C, I, LocalEneityId> {
    return new ResourceClient(this, entityId);
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

  async _proxy<T = unknown>(
    connectorId: C[number]["id"],
    ownerId: string,
    params: ConnectionProxyParams
  ): Promise<EitherDataOrError<T>> {
    const tracer = this.logger?.newTracer("connection::proxy", {
      request: { ...params },
    });
    tracer?.debug("Starting proxy request", {
      context: { connectorId, ownerId },
      ...params,
    });

    try {
      const { path, method, data, query = {}, headers = {} } = params;

      const { data: connectorData, error: connectorError } =
        await this.config.morph.connectors().retrieve(connectorId);

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
        this.config.morph,
        connectorId,
        ownerId,
        this.logger
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

  webhook(): WebhookClient<A, C, I> {
    return new WebhookClient(this);
  }
}

export class AllConnectionsClient<
  A extends Adapter,
  C extends ConnectorBundle<
    I,
    ResourceModelOperations,
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>>
  >[],
  I extends string,
> {
  private morph: MorphClient<A, C>;

  constructor(morph: MorphClient<A, C>) {
    this.morph = morph;
  }
  /*
  list(
    params?: Omit<ConnectionListParams, "iterator">
  ): Promise<EitherDataOrError<ConnectionListResponse>>;
  list(
    params: ConnectionListParams & { iterator: true }
  ): AsyncIterableIterator<ConnectionData>;
  list(
    params: ConnectionListParams = {}
  ):
    | Promise<EitherDataOrError<ConnectionListResponse>>
    | AsyncIterableIterator<ConnectionData> {
    if (params.iterator === true) {
      return this.listIterator(
        params as Omit<ConnectionListParams, "iterator"> & { iterator: true }
      );
    } else {
      return this.listRegular(params);
    }
  }

  private async listRegular(
    params: Omit<ConnectionListParams, "iterator">
  ): Promise<EitherDataOrError<ConnectionListResponse>> {
    try {
      const { limit = 50, filter = {}, cursor, sort } = params;

      // Decode and parse the cursor if it exists
      let decodedCursor: { connectorId: string; ownerId: string } | undefined;
      if (cursor) {
        try {
          const decodedString = Buffer.from(cursor, "base64").toString("utf-8");
          decodedCursor = JSON.parse(decodedString);
        } catch (e) {
          return {
            error: new MorphError({
              code: "MORPH_INVALID_CURSOR",
              message: "The provided cursor is invalid.",
            }),
          };
        }
      }

      const connections = await this.morph.𝙢_.database.adapter.listConnections({
        limit,
        filter,
        cursor: decodedCursor,
        sort,
      });

      // Encode the next cursor
      let encodedNextCursor: string | undefined;
      if (connections.next) {
        const cursorString = JSON.stringify(connections.next);
        encodedNextCursor = Buffer.from(cursorString).toString("base64");
      }

      const response: ConnectionListResponse = {
        object: "list",
        data: connections.data.map((ca) =>
          connectionAdapterToConnectionData(ca)
        ),
        next: encodedNextCursor,
      };

      return { data: response };
    } catch (e) {
      return {
        error: new MorphError({
          code: "MORPH_CONNECTION_LIST_FAILED",
          message: `Failed to list connections: ${
            e instanceof Error ? e.message : String(e)
          }`,
        }),
      };
    }
  }

  private listIterator(
    params: Omit<ConnectionListParams, "iterator"> & { iterator: true }
  ): AsyncIterableIterator<ConnectionData> {
    const self = this;
    return {
      async *[Symbol.asyncIterator]() {
        let currentCursor: string | undefined = undefined;

        while (true) {
          const result: EitherDataOrError<ConnectionListResponse> =
            await self.listRegular({
              ...params,
              cursor: currentCursor,
            });

          if (result.error) {
            throw result.error;
          }

          const listResponse: ConnectionListResponse = result.data;

          for (const connection of listResponse.data) {
            yield connection;
          }

          if (!listResponse.next) {
            break;
          }

          currentCursor = listResponse.next;
        }
      },
      next() {
        return this[Symbol.asyncIterator]().next();
      },
    };
  }
*/
  callback(
    params: AuthorizeParams
  ): Awaitable<
    EitherTypeOrError<{ connection: ConnectionData; redirectUrl: string }>
  > {
    return oautCallback(this.morph, params);
  }
}
