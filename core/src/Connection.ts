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
  WebhookOperations,
  ResourceEvents,
  ArrayToIndexedObject,
  Settings,
  ExtractMetadataKeys,
  SettingFieldsToRecord,
  ConnectionProxyOptions,
  SettingFieldValue,
  ExtractCS,
} from "@runmorph/cdk";
import axios, { AxiosRequestConfig } from "axios";

import { MorphClient } from "./Morph";
import { ResourceClient } from "./Resource";
import type { AdapterConnection, CreateAuthorizationParams } from "./types";
import { decryptJson, encryptJson } from "./utils/encryption";
import {
  generateAuthorizationUrl,
  getAuthorizationHeader,
} from "./utils/oauth";
import { WebhookClient } from "./Webhook";
import { ModelClient } from "./Models";

type ConnectorResourceModelId<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  C extends ConnectorBundle<any, any, any, any, any, any>,
> = keyof C["resourceModelOperations"];

function validateAuthorizationSettings(
  connector: ConnectorBundle<
    string,
    Settings,
    Settings,
    string,
    ResourceModelOperations,
    WebhookOperations<
      ResourceEvents,
      Record<string, ResourceEvents>,
      string,
      string
    >
  >,
  settings: Record<string, string>,
  strict: boolean = true
): EitherTypeOrError<{ settings: Record<string, string> }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  C extends ConnectorBundle<any, any, any, any, any, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CA extends ConnectorBundle<any, any, any, any, any, any>[],
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
    params: ConnectionIds<C["id"]> | { sessionToken: string }
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

  /**
   * Gets the connector associated with this connection.
   *
   * @returns The connector associated with this connection.
   * @throws Error if the connection IDs cannot be retrieved or if the connector is not found.
   */
  getConnector<TConnector extends C["connector"]>(): {
    getSetting(key: any): any;
  } {
    const { data: connectionIds, error } = this.getConnectionIds();
    if (error) {
      this.morph.m_.logger?.error("Failed to get connection IDs", { error });
      throw new Error(`Failed to get connection IDs: ${error.message}`);
    }

    const connector = this.morph.m_.connectors[connectionIds.connectorId]
      .connector as {
      getSetting(key: any): any;
    };
    if (!connector) {
      const errorMessage = `Connector not found for ID: ${connectionIds.connectorId}`;
      this.morph.m_.logger?.error(errorMessage);
      throw new Error(errorMessage);
    }

    return connector;
  }

  async create(
    params?: ConnectionCreateParams<[C]>
  ): Promise<EitherDataOrError<ConnectionData>> {
    const { data: connectionids, error } = this.getConnectionIds();
    if (error) return { error };
    const { ownerId, connectorId } = connectionids;
    this.morph.m_.logger?.debug("Creating connection", {
      params,
      connectorId,
      ownerId,
    });

    const { data: connectorData, error: connectorError } = await this.morph
      .connectors()
      .retrieve(connectorId);
    if (connectorError) {
      this.morph.m_.logger?.error("Failed to retrieve connector", {
        error: connectorError,
      });
      return { error: connectorError };
    }

    try {
      const connectionAdapter =
        await this.morph.m_.database.adapter.createConnection({
          connectorId: connectorId,
          ownerId: ownerId,
          status: "unauthorized",
          operations: params?.operations || [],
          authorizationType: connectorData.connector.auth.type,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      this.morph.m_.logger?.info("Connection created successfully", {
        connectorId,
        ownerId,
      });
      return { data: connectionAdapterToConnectionData(connectionAdapter) };
    } catch (e) {
      this.morph.m_.logger?.error("Failed to create connection", { error: e });
      return {
        error: {
          code: "MORPH::CONNECTION::CREATION_FAILED",
          message: `Details : ${JSON.stringify(e)}`,
        },
      };
    }
  }

  async getSetting<
    TSettingRecord extends SettingFieldsToRecord<Settings>,
    TKey extends keyof TSettingRecord,
  >(key: TKey): Promise<TSettingRecord[TKey] | undefined>;
  async getSetting(key: string): Promise<any> {
    this.morph.m_.logger?.debug("Getting connection setting", { key });

    const { data: connectionData, error } = await this.retrieveConnectionData();
    if (error) {
      this.morph.m_.logger?.debug("Failed to retrieve connection data", {
        error,
      });
      return undefined;
    }

    try {
      if (!connectionData.authorizationData) {
        this.morph.m_.logger?.debug("No authorization data found");
        return undefined;
      }

      const authorizationJson = JSON.parse(
        connectionData.authorizationData
      ) as ConnectionAuthorizationStoredData;

      const value = authorizationJson.settings
        ? authorizationJson.settings[key]
        : undefined;

      this.morph.m_.logger?.debug("Retrieved setting value", { key, value });
      return value;
    } catch (e) {
      this.morph.m_.logger?.error("Failed to parse authorization data", {
        error: e,
      });
      return undefined;
    }
  }

  getMetadata: ((key: string) => Promise<string | undefined>) &
    (<TKey extends ExtractMetadataKeys<C["connector"]>>(
      key: TKey
    ) => Promise<string | undefined>) = async (
    key: string
  ): Promise<string | undefined> => {
    this.morph.m_.logger?.debug("Getting connection metadata", { key });

    const { data: connectionData, error } = await this.retrieveConnectionData();
    if (error) {
      this.morph.m_.logger?.debug("Failed to retrieve connection data", {
        error,
      });
      return undefined;
    }

    try {
      if (!connectionData.authorizationData) {
        this.morph.m_.logger?.debug("No authorization data found");
        return undefined;
      }

      const authorizationJson = JSON.parse(
        connectionData.authorizationData
      ) as ConnectionAuthorizationStoredData;

      if (!authorizationJson.metadata) {
        this.morph.m_.logger?.debug("No metadata found");
        return undefined;
      }

      const value = authorizationJson.metadata[key];
      this.morph.m_.logger?.debug("Retrieved metadata value", { key, value });
      return value;
    } catch (e) {
      this.morph.m_.logger?.error("Failed to parse authorization data", {
        error: e,
      });
      return undefined;
    }
  };

  setMetadata: ((
    key: string,
    value: string
  ) => Promise<EitherTypeOrError<object>>) &
    (<TKey extends ExtractMetadataKeys<C["connector"]>>(
      key: TKey,
      value: string
    ) => Promise<EitherTypeOrError<object>>) = async (
    key: string,
    value: string
  ): Promise<EitherTypeOrError<object>> => {
    const { data: connectionids, error } = this.getConnectionIds();
    if (error) return { error };

    const { ownerId, connectorId } = connectionids;
    this.morph.m_.logger?.debug("Setting connection metadata", {
      connectorId,
      ownerId,
    });

    const { data: connectionData, error: retrieveError } =
      await this.retrieveConnectionData();
    if (retrieveError) return { error: retrieveError };

    try {
      let authorizationData: ConnectionAuthorizationStoredData = {};

      if (connectionData.authorizationData) {
        authorizationData = JSON.parse(connectionData.authorizationData);
      }

      if (!authorizationData.metadata) {
        authorizationData.metadata = {};
      }

      authorizationData.metadata[key] = value;

      await this.morph.m_.database.adapter.updateConnection(
        { connectorId, ownerId },
        {
          authorizationData: JSON.stringify(authorizationData),
          updatedAt: new Date(),
        }
      );

      this.morph.m_.logger?.info("Connection metadata updated successfully", {
        connectorId,
        ownerId,
      });

      return {};
    } catch (e) {
      this.morph.m_.logger?.error("Failed to update connection metadata", {
        error: e,
      });
      return {
        error: {
          code: "MORPH::CONNECTION::UPDATE_FAILED",
          message: `Failed to update connection metadata: ${JSON.stringify(e)}`,
        },
      };
    }
  };

  async update(
    params?: ConnectionUpdateParams<[C]>
  ): Promise<EitherDataOrError<ConnectionData>> {
    console.log({ params });
    const { data: connectionids, error } = this.getConnectionIds();
    if (error) return { error };
    const { ownerId, connectorId } = connectionids;
    this.morph.m_.logger?.debug("Updating connection", {
      params,
      connectorId,
      ownerId,
    });

    const { data: currentConnection, error: retrieveError } =
      await this.retrieve();
    if (retrieveError) {
      this.morph.m_.logger?.error("Failed to retrieve connection for update", {
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
        await this.morph.m_.database.adapter.updateConnection(
          { connectorId, ownerId },
          { operations: updatedOperations, updatedAt: new Date() }
        );

      this.morph.m_.logger?.info("Connection updated successfully", {
        connectorId,
        ownerId,
      });
      return {
        data: connectionAdapterToConnectionData(updatedConnectionAdapter),
      };
    } catch (e) {
      this.morph.m_.logger?.error("Failed to update connection", { error: e });
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

  private async retrieveConnectionData(): Promise<
    EitherDataOrError<AdapterConnection>
  > {
    const { data: connectionids, error } = this.getConnectionIds();
    if (error) {
      this.morph.m_.logger?.error(
        "isConnector : Failed to get connection ids",
        {
          error,
        }
      );
      return { error };
    }

    const { ownerId, connectorId } = connectionids;
    this.morph.m_.logger?.debug("Retrieving connection", {
      connectorId,
      ownerId,
    });

    try {
      const connectionAdapter =
        await this.morph.m_.database.adapter.retrieveConnection({
          connectorId,
          ownerId,
        });

      if (!connectionAdapter) {
        this.morph.m_.logger?.warn("Connection not found", {
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

      this.morph.m_.logger?.debug("Connection retrieved successfully", {
        connectorId,
        ownerId,
      });
      return { data: connectionAdapter };
    } catch (e) {
      this.morph.m_.logger?.error("Failed to retrieve connection", {
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

  async retrieve(): Promise<EitherDataOrError<ConnectionData>> {
    const { data: connectionData, error } = await this.retrieveConnectionData();

    if (error) {
      return { error };
    }
    return { data: connectionAdapterToConnectionData(connectionData) };
  }

  async delete(): Promise<ErrorOrVoid> {
    const { data: connectionids, error } = this.getConnectionIds();
    if (error) {
      this.morph.m_.logger?.error(
        "isConnector : Failed to get connection ids",
        {
          error,
        }
      );
      return { error };
    }

    const { ownerId, connectorId } = connectionids;
    this.morph.m_.logger?.debug("Deleting connection", {
      connectorId,
      ownerId,
    });

    try {
      await this.morph.m_.database.adapter.deleteConnection({
        connectorId,
        ownerId,
      });
      this.morph.m_.logger?.info("Connection deleted successfully", {
        connectorId,
        ownerId,
      });
      return {};
    } catch (e) {
      this.morph.m_.logger?.error("Failed to delete connection", {
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
      this.morph.m_.logger?.error(
        "isConnector : Failed to get connection ids",
        {
          error,
        }
      );
      return { error };
    }

    const { ownerId, connectorId } = connectionids;

    this.morph.m_.logger?.debug("Starting authorization process", {
      connectorId,
      ownerId,
      params,
    });

    console.log("core.authorize", {
      params,
    });

    try {
      const redirectUrl = params?.redirectUrl;
      const scopes = params?.scopes || [];

      const connector = this.morph.m_.connectors[connectorId] as C;
      const connectorDefaultScopes =
        connector.connector.auth.getDefaultScopes() || [];
      scopes.push(
        ...connectorDefaultScopes.filter(
          (scope: string) => !scopes.includes(scope)
        )
      );

      this.morph.m_.logger?.debug("Processing scopes", {
        initialScopes: scopes,
      });

      const connection =
        await this.morph.m_.database.adapter.retrieveConnection({
          connectorId,
          ownerId,
        });

      if (!connection) {
        this.morph.m_.logger?.error(
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

      // First, calculate all required scopes from operations
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

      // If connection is already authorized, check if we need to update authorization
      if (connection.status === "authorized" && connection.authorizationData) {
        try {
          this.morph.m_.logger?.debug(
            "Attempting to parse authorization data",
            {
              connectorId,
              ownerId,
              authorizationData: connection.authorizationData,
            }
          );

          const existingAuthData = JSON.parse(connection.authorizationData);

          this.morph.m_.logger?.debug(
            "Successfully parsed authorization data",
            {
              connectorId,
              ownerId,
              existingAuthData,
            }
          );

          // Convert scopes to array if it's an object
          const existingScopes = Array.isArray(existingAuthData.scopes)
            ? existingAuthData.scopes
            : Object.values(existingAuthData.scopes || {});
          const existingSettings = existingAuthData.settings || {};

          this.morph.m_.logger?.debug("Processed authorization data", {
            connectorId,
            ownerId,
            existingScopes,
            existingSettings,
          });

          // Check if we have a valid OAuth access token
          const hasValidAccessToken =
            existingAuthData.oauth?._accessToken != null;
          if (!hasValidAccessToken) {
            this.morph.m_.logger?.info(
              "Reauthorizing connection - missing access token",
              {
                connectorId,
                ownerId,
                hasOauth: !!existingAuthData.oauth,
                hasAccessToken: !!existingAuthData.oauth?._accessToken,
              }
            );
            // Continue with new authorization by not returning here
            // This will fall through to the new authorization code below
          } else {
            // Check if all required scopes are present in existing authorization
            const hasAllRequiredScopes = scopes.every((scope) =>
              existingScopes.includes(scope)
            );

            // Check if all required settings are present and unchanged
            const { settings: requiredSettings, error: settingsError } =
              validateAuthorizationSettings(connector, params?.settings || {});
            if (settingsError) return { error: settingsError };

            const hasAllRequiredSettings = Object.entries(
              requiredSettings
            ).every(([key, value]) => existingSettings[key] === value);

            // If we have all required scopes and settings, preserve the existing authorization
            if (hasAllRequiredScopes && hasAllRequiredSettings) {
              const authorizationUrl = await generateAuthorizationUrl({
                connector,
                ownerId,
                scopes: existingScopes,
                settings: existingSettings,
                redirectUrl,
              });

              const connectionAuthorizationData: ConnectionAuthorizationData = {
                object: "connectionAuthorization",
                connectorId: connectorId,
                ownerId: ownerId,
                status: "authorized",
                scopes: existingScopes,
                settings: existingSettings,
                authorizationUrl,
              };

              this.morph.m_.logger?.info(
                "Returning existing authorized connection - all required scopes and settings present",
                {
                  connectorId,
                  ownerId,
                  existingScopes,
                  requiredScopes: scopes,
                  existingSettings,
                  requiredSettings,
                }
              );
              return { data: decryptJson(connectionAuthorizationData) };
            } else {
              this.morph.m_.logger?.info(
                "Reauthorizing connection - new scopes or settings required",
                {
                  connectorId,
                  ownerId,
                  existingScopes,
                  requiredScopes: scopes,
                  existingSettings,
                  requiredSettings,
                  missingScopes: scopes.filter(
                    (scope) => !existingScopes.includes(scope)
                  ),
                  hasAllRequiredScopes,
                  hasAllRequiredSettings,
                }
              );
            }
          }
        } catch (error) {
          this.morph.m_.logger?.warn(
            "Failed to parse existing authorization data",
            {
              error:
                error instanceof Error
                  ? {
                      name: error.name,
                      message: error.message,
                      stack: error.stack,
                    }
                  : error,
              connectorId,
              ownerId,
              rawAuthorizationData: connection.authorizationData,
            }
          );
          // Continue with new authorization if parsing existing data fails
        }
      }

      // Proceed with new authorization
      const { settings, error: settingsError } = validateAuthorizationSettings(
        connector,
        params?.settings || {}
      );

      if (settingsError) return { error: settingsError };

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

      await this.morph.m_.database.adapter.updateConnection(
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

      const authorizationUrl = await generateAuthorizationUrl({
        connector,
        ownerId,
        scopes,
        settings,
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

      this.morph.m_.logger?.info("Authorization process completed", {
        connectorId,
        ownerId,
        scopes,
        authorizationUrl,
      });
      return { data: decryptJson(connectionAuthorizationData) };
    } catch (error) {
      this.morph.m_.logger?.error("Authorization process failed", {
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
    params: ConnectionProxyParams,
    options?: ConnectionProxyOptions
  ): Promise<EitherDataOrError<T>> {
    const { data: connectionids, error } = this.getConnectionIds();
    if (error) return { error };
    const { ownerId, connectorId } = connectionids;
    const tracer = this.morph.m_.logger?.newTracer("connection::proxy", {
      request: { ...params },
    });
    tracer?.debug("Starting proxy request", {
      context: { connectorId, ownerId },
      ...params,
    });

    const { refreshToken } = options || {};
    try {
      const { path, method, data, query = {}, headers = {} } = params;

      const { data: connectorData, error: connectorError } = await this.morph
        .connectors()
        .retrieve(connectorId);

      if (connectorError) {
        tracer?.closeTracer({ error: connectorError });
        return { error: connectorError };
      }

      const baseUrl = await connectorData.connector.generateProxyBaseUrl({
        connection: this,
        connector: {
          getSetting: async (key) => {
            const connectorOptions =
              this.morph.m_.connectors[connectorId].connector.getOptions();
            if (!connectorOptions) {
              return undefined;
            }
            return connectorOptions[
              key as keyof typeof connectorOptions
            ] as any;
          },
        },
      });
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

      // Assume baseUrl return can include a pre path
      const baseUrlObj = new URL(baseUrl);
      const basePath = baseUrlObj.pathname.endsWith("/")
        ? baseUrlObj.pathname.slice(0, -1)
        : baseUrlObj.pathname;
      const cleanPath = path.startsWith("/") ? path : `/${path}`;
      baseUrlObj.pathname = `${basePath}${cleanPath}`;
      const url = baseUrlObj;

      tracer?.debug("Proxy request URL", {
        url,
      });

      // Add query parameters to the URL
      const queryString = this.serializeQuery(query);
      if (queryString) {
        url.search = queryString;
      }

      // Get the authorization header
      const authHeader = await getAuthorizationHeader({
        morph: this.morph,
        connectorId,
        ownerId,
        logger: this.morph.m_.logger,
        refreshToken,
      });

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
              if (!refreshToken) {
                return await this.proxy(params, {
                  ...options,
                  refreshToken: true,
                });
              } else {
                return {
                  error: {
                    code: "MORPH::CONNECTION::PROXY::UNAUTHORIZED",
                    message: error.response?.data
                      ? JSON.stringify(error.response?.data, null, 2)
                      : error.message,
                  },
                };
              }
            case 403:
              if (!refreshToken) {
                return await this.proxy(params, {
                  ...options,
                  refreshToken: true,
                });
              } else {
                return {
                  error: {
                    code: "MORPH::CONNECTION::PROXY::FORBIDDEN",
                    message: error.response?.data
                      ? JSON.stringify(error.response?.data, null, 2)
                      : error.message,
                  },
                };
              }
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

  models<LocalResourceModelId extends ConnectorResourceModelId<C>>(
    resourceModelId: LocalResourceModelId
  ): ModelClient<C, CA, LocalResourceModelId> {
    return new ModelClient(this.morph, this, resourceModelId);
  }

  isConnector<TConnectorIds extends CA[number]["id"]>(
    ...connectorIds: TConnectorIds[]
  ): ConnectionClient<
    ArrayToIndexedObject<CA, "id">[TConnectorIds],
    CA
  > | null {
    const { data: ids, error } = this.getConnectionIds();
    if (error) {
      this.morph.m_.logger?.error(
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
      this.morph.m_.logger?.error(
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
    return new WebhookClient(this.morph, this);
  }
}

export class AllConnectionsClient<
  C extends ConnectorBundle<
    I,
    Settings,
    Settings,
    string,
    ResourceModelOperations,
    WebhookOperations<
      ResourceEvents,
      Record<string, ResourceEvents>,
      string,
      string
    >
  >[],
  I extends string,
> {
  private morph: MorphClient<C>;

  constructor(morph: MorphClient<C>) {
    this.morph = morph;
  }
}
