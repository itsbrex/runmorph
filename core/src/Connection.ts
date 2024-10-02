import { Connector } from "@runmorph/cdk";
import axios, { AxiosRequestConfig } from "axios";

import { MorphError } from "./Error";
import { MorphClient } from "./Morph";
import { Resource } from "./Resource";
import type {
  ConnectionCreateParams,
  ConnectionAuthorizationData,
  ConnectionUpdateParams,
  ConnectionData,
  ConnectionIds,
  EitherOr,
  Awaitable,
  EitherDataOrError,
  AuthorizeParams,
  Adapter,
  AdapterConnection,
  ErrorOrVoid,
  ConnectionProxyParams,
  CreateAuthorizationParams,
  ConnectionAuthorizationStoredData,
} from "./types";
import { decryptJson, encryptJson } from "./utils/encryption";
import {
  generateAuthorizationUrl,
  getAuthorizationHeader,
  oautCallback,
} from "./utils/oauth";

function validateAuthorizationSettings(
  connector: Connector<string>,
  settings: Record<string, string>,
  strict: boolean = true,
): EitherOr<[{ settings: Record<string, string> }, { error: MorphError }]> {
  const finalSettings = { ...settings };
  const missingSettings: string[] = [];

  for (const setting of connector.auth.getSettingFields()) {
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
      error: new MorphError({
        code: "MORPH_CONNECTION_MISSING_REQUIRED_AUTHORIZATION_SETTINGS",
        message: `Missing required authorization settings: ${missingSettings.join(
          ", ",
        )}`,
      }),
    };
  }

  return { settings: finalSettings };
}

function connectionAdapterToConnectionData(
  adapterConnection: AdapterConnection,
): ConnectionData {
  return {
    object: "connection",
    connectorId: adapterConnection.connectorId,
    ownerId: adapterConnection.ownerId,
    status: adapterConnection.status,
    operations: adapterConnection.operations,
    createdAt: adapterConnection.createdAt,
    updatedAt: adapterConnection.updatedAt,
  };
}

type ConnectionClientBase<
  A extends Adapter,
  C extends Connector<I>[],
  I extends string,
> = {
  morph: MorphClient<A, C, I>;
};

type ConnectionClientConnection<
  A extends Adapter,
  C extends Connector<I>[],
  I extends string,
> = ConnectionClientBase<A, C, I> & {
  type: "connection";
  connectorId: I;
  ownerId: string;
  sessionToken?: never;
};

type ConnectionClientSession<
  A extends Adapter,
  C extends Connector<I>[],
  I extends string,
> = ConnectionClientBase<A, C, I> & {
  type: "connectionSession";
  sessionToken: string;
  connectorId?: never;
  ownerId?: never;
};

type ConnectionClientType<
  A extends Adapter,
  C extends Connector<I>[],
  I extends string,
> = ConnectionClientConnection<A, C, I> | ConnectionClientSession<A, C, I>;

export class ConnectionClient<
  A extends Adapter,
  C extends Connector<I>[],
  I extends string,
> {
  private config: ConnectionClientType<A, C, I>;

  constructor(
    morph: MorphClient<A, C, I>,
    params: ConnectionIds<I> | { sessionToken: string },
  ) {
    if ("sessionToken" in params) {
      this.config = {
        type: "connectionSession",
        morph,
        sessionToken: params.sessionToken,
      };
    } else {
      this.config = {
        type: "connection",
        morph,
        connectorId: params.connectorId,
        ownerId: params.ownerId,
      };
    }
  }

  async create(
    params: ConnectionCreateParams,
  ): Promise<EitherDataOrError<ConnectionData>> {
    const { data: ids, error } = await this._getConnectionIds();
    if (error) return { error };
    return this._create(ids.connectorId, ids.ownerId, params);
  }

  async update(
    params: ConnectionUpdateParams,
  ): Promise<EitherDataOrError<ConnectionData>> {
    const { data: ids, error } = await this._getConnectionIds();
    if (error) return { error };
    return this._update(ids.connectorId, ids.ownerId, params);
  }

  async updateOrCreate(
    params: ConnectionCreateParams,
  ): Promise<EitherDataOrError<ConnectionData>> {
    const { data: ids, error } = await this._getConnectionIds();
    if (error) return { error };
    return this._updateOrCreate(ids.connectorId, ids.ownerId, params);
  }

  async retrieve(): Promise<EitherDataOrError<ConnectionData>> {
    const { data: ids, error } = await this._getConnectionIds();
    if (error) return { error };
    return this._retrieve(ids.connectorId, ids.ownerId);
  }

  async delete(): Promise<ErrorOrVoid> {
    const { data: ids, error } = await this._getConnectionIds();
    if (error) return { error };
    return this._delete(ids.connectorId, ids.ownerId);
  }

  async authorize(
    params: CreateAuthorizationParams,
  ): Promise<EitherDataOrError<ConnectionAuthorizationData>> {
    const { data: ids, error } = await this._getConnectionIds();
    if (error) return { error };
    return this._authorize(ids.connectorId, ids.ownerId, params);
  }

  async proxy(
    params: ConnectionProxyParams,
  ): Promise<EitherDataOrError<unknown>> {
    const { data: ids, error } = await this._getConnectionIds();
    if (error) return { error };
    return this._proxy(ids.connectorId, ids.ownerId, params);
  }

  private async _create(
    connectorId: I,
    ownerId: string,
    params: ConnectionCreateParams,
  ): Promise<EitherDataOrError<ConnectionData>> {
    const { data: connectorData, error: connectorError } =
      await this.config.morph.connector().retrieve(connectorId);
    if (connectorError) return { error: connectorError };

    try {
      const connectionAdapter =
        await this.config.morph.database.adapter.createConnection({
          connectorId: connectorId,
          ownerId: ownerId,
          status: "unauthorized",
          operations: params.operations || [],
          authorizationType: connectorData.auth.type,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      return { data: connectionAdapterToConnectionData(connectionAdapter) };
    } catch (e) {
      return {
        error: new MorphError({
          code: "MORPH_CONNECTION_CREATION_FAILED",
          message: `Details : ${JSON.stringify(e)}`,
        }),
      };
    }
  }

  private async _update(
    connectorId: I,
    ownerId: string,
    params: ConnectionUpdateParams,
  ): Promise<EitherDataOrError<ConnectionData>> {
    const { data: currentConnection, error: retrieveError } =
      await this.retrieve();
    if (retrieveError) return { error: retrieveError };

    let updatedOperations = currentConnection.operations;

    if (params.operations) {
      updatedOperations = params.operations;
    }

    try {
      const updatedConnectionAdapter =
        await this.config.morph.database.adapter.updateConnection(
          {
            connectorId: connectorId,
            ownerId: ownerId,
          },
          {
            operations: updatedOperations,
            updatedAt: new Date().toISOString(),
          },
        );

      return {
        data: connectionAdapterToConnectionData(updatedConnectionAdapter),
      };
    } catch (e) {
      return {
        error: new MorphError({
          code: "MORPH_CONNECTION_UPDATE_FAILED",
          message: `Failed to update connection: ${JSON.stringify(e)}`,
        }),
      };
    }
  }

  private async _retrieve(
    connectorId: I,
    ownerId: string,
  ): Promise<EitherDataOrError<ConnectionData>> {
    try {
      const connectionAdapter =
        await this.config.morph.database.adapter.retrieveConnection({
          connectorId: connectorId,
          ownerId: ownerId,
        });

      if (!connectionAdapter)
        return {
          error: new MorphError({
            code: "MOPH_CONNECTION_UNKNOWN",
            message: `Connection with connectorId '${connectorId}' and ownerId '${ownerId}' couldn't be found.`,
          }),
        };
      return { data: connectionAdapterToConnectionData(connectionAdapter) };
    } catch (e) {
      console.log("Error retrieving connection", e);
      return {
        error: new MorphError({
          code: "MORPH_CONNECTION_RETRIEVE_FAILED",
          message: `Details : ${JSON.stringify(e)}`,
        }),
      };
    }
  }

  private async _getConnectionIds(): Promise<
    EitherDataOrError<{ connectorId: I; ownerId: string }>
  > {
    switch (this.config.type) {
      case "connection":
        return {
          data: {
            connectorId: this.config.connectorId,
            ownerId: this.config.ownerId,
          },
        };
      case "connectionSession": {
        const { data, error } = await this.config.morph
          .session()
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
    connectorId: I,
    ownerId: string,
    params: ConnectionUpdateParams,
  ): Promise<EitherDataOrError<ConnectionData>> {
    // First, try to retrieve the existing connection
    const { error: retrieveError } = await this._retrieve(connectorId, ownerId);

    if (retrieveError) {
      // If the connection doesn't exist, create a new one
      if (retrieveError.code === "MOPH_CONNECTION_UNKNOWN") {
        return this._create(connectorId, ownerId, params);
      }
      // If there's a different error, return it
      return { error: retrieveError };
    }

    // If the connection exists, update it
    return this._update(connectorId, ownerId, params as ConnectionUpdateParams);
  }

  async _delete(connectorId: I, ownerId: string): Promise<ErrorOrVoid> {
    try {
      await this.config.morph.database.adapter.deleteConnection({
        connectorId: connectorId,
        ownerId: ownerId,
      });
      return {};
    } catch (e) {
      return {
        error: new MorphError({
          code: "MORPH_CONNECTION_DELETE_FAILED",
          message: `Details : ${JSON.stringify(e)}`,
        }),
      };
    }
  }

  async _authorize(
    connectorId: I,
    ownerId: string,
    params: CreateAuthorizationParams,
  ): Promise<EitherDataOrError<ConnectionAuthorizationData>> {
    try {
      const { data: connectorData, error: connectorError } =
        await this.config.morph.connector().retrieve(connectorId);
      if (connectorError) return { error: connectorError };

      const redirectUrl = params?.redirectUrl;
      const scopes = params?.scopes || [];

      const { settings, error } = validateAuthorizationSettings(
        connectorData,
        params?.settings || {},
      );

      if (error) return { error };

      if (connectorData.auth.type !== "oauth2") {
        return {
          error: new MorphError({
            code: "MORPH_NOT_SUPPORTED",
            message: "Only 'oauth2' type authorization supported.",
          }),
        };
      }

      const authorizationStoredData: ConnectionAuthorizationStoredData = {
        scopes: scopes,
        settings: settings,
      };

      await this.config.morph.database.adapter.updateConnection(
        {
          connectorId: connectorId,
          ownerId: ownerId,
        },
        {
          authorizationData: JSON.stringify(
            encryptJson(authorizationStoredData),
          ),
          updatedAt: new Date().toISOString(),
        },
      );

      const authorizationUrl = generateAuthorizationUrl({
        connector: connectorData,
        ownerId: ownerId,
        scopes: scopes,
        redirectUrl,
      });

      const connectionAuthorizationData: ConnectionAuthorizationData = {
        object: "connection.authorization",
        connectorId: connectorId,
        ownerId: ownerId,
        status: "awaiting_authorization", // TODO: not if connection already authorize. Need to connection.verify();
        scopes: scopes,
        settings: settings,
        authorizationUrl,
      };

      return { data: decryptJson(connectionAuthorizationData) };
    } catch (error) {
      return error instanceof MorphError
        ? { error }
        : {
            error: new MorphError({
              code: "MORPH_UNKNONW_ERROR",
              message: `Details : ${error}`,
            }),
          };
    }
  }

  _resource(resourceType: string): Resource {
    // Implementation
    return new Resource(resourceType);
  }

  private serializeQuery(
    query: Record<string, unknown>,
    prefix: string = "",
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
            .join(",")}`,
        );
      } else {
        queryParts.push(encode(parentKey, obj));
      }
    };

    buildQuery(query, prefix);

    return queryParts.join("&");
  }

  async _proxy(
    connectorId: I,
    ownerId: string,
    params: ConnectionProxyParams,
  ): Promise<EitherDataOrError<unknown>> {
    try {
      const { path, method, data, query = {}, headers = {} } = params;
      const { data: connectorData, error: connectorError } =
        await this.config.morph.connector().retrieve(connectorId);
      if (connectorError) return { error: connectorError };

      const baseUrl = connectorData.generateProxyBaseUrl({});
      if (!baseUrl) {
        return {
          error: new MorphError({
            code: "MORPH_CONNECTOR_INVALID_CONFIG",
            message: "Proxy API base URL is not defined for this connector.",
          }),
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
      return { data: response.data };
    } catch (e) {
      if (axios.isAxiosError(e)) {
        return {
          error: new MorphError({
            code: "MORPH_PROXY_REQUEST_FAILED",
            message: `Proxy request failed: ${JSON.stringify(e)}`,
          }),
        };
      }
      return {
        error: new MorphError({
          code: "MORPH_PROXY_REQUEST_FAILED",
          message: `Proxy request failed: ${JSON.stringify(e)}`,
        }),
      };
    }
  }
}

export class AllConnectionsClient<
  A extends Adapter,
  C extends Connector<I>[],
  I extends string,
> {
  private morph: MorphClient<A, C, I>;

  constructor(morph: MorphClient<A, C, I>) {
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

      const connections = await this.morph.database.adapter.listConnections({
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
    params: AuthorizeParams,
  ): Awaitable<
    EitherOr<
      [
        { connection: ConnectionData; redirectUrl: string },
        { error: MorphError },
      ]
    >
  > {
    return oautCallback(this.morph, params);
  }
}
