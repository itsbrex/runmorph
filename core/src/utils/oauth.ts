import { URLSearchParams } from "url";

import type {
  ConnectorBundle,
  ResourceModelOperations,
  ConnectionAuthorizationOAuthData,
  ConnectionAuthorizationStoredData,
  ConnectionData,
  EitherTypeOrError,
  Logger,
  WebhookOperations,
  ResourceEvents,
  Settings,
} from "@runmorph/cdk";
import axios from "axios";

import { MorphClient } from "../Morph";
import {
  Adapter,
  AuthorizeParams,
  ExchangeCodeForTokenParams,
  FetchOAuthTokenParams,
  GenerateAuthorizationUrlParams,
  OAuthToken,
  TokenResponse,
} from "../types";

import { decryptJson, encryptJson } from "./encryption";

export async function generateAuthorizationUrl({
  connector,
  ownerId,
  scopes,
  settings,
  redirectUrl,
}: GenerateAuthorizationUrlParams): Promise<string> {
  const connectorId = connector.connector.id;
  const clientId = getConnectorClientId(connector);
  const redirectUri = getConnectorCallbackUrl(connectorId);
  const state = encryptJson(
    {
      connectorId,
      ownerId,
      timestamp: Date.now(),
      redirectUrl,
    },
    true
  );
  const urlAndHeaders = await connector.connector.auth.generateAuthorizeUrl({
    connector: {
      getSetting: async (key) => {
        const connectorOptions = connector.connector.getOptions();
        if (!connectorOptions) {
          return undefined;
        }
        return connectorOptions[key as keyof typeof connectorOptions] as any;
      },
    },
    connection: {
      getMetadata: async () => undefined,
      getSetting: async (key) =>
        settings ? (settings[key as keyof typeof settings] as any) : undefined,
    },
  });
  const url = new URL(urlAndHeaders.url);
  url.searchParams.append("client_id", clientId);
  url.searchParams.append("redirect_uri", redirectUri);
  url.searchParams.append("state", JSON.stringify(state));
  url.searchParams.append("response_type", "code");
  if (scopes) {
    url.searchParams.append("scope", scopes.join(" "));
  }
  return url.toString();
}

export async function exchangeCodeForToken({
  connector,
  code,
}: ExchangeCodeForTokenParams): Promise<TokenResponse> {
  const clientId = getConnectorClientId(connector);
  const clientSecret = getConnectorClientSecret(connector);
  const redirectUri = getConnectorCallbackUrl(connector.connector.id);
  const urlAndHeaders = await connector.connector.auth.generateAccessTokenUrl(
    {} as any
  );
  const response = await axios.post(
    urlAndHeaders.url,
    {
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    },
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...(urlAndHeaders.headers || {}),
      },
    }
  );

  return response.data;
}

export function getConnectorOAuthCredentials(
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
  >
): {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
} {
  const clientId = getConnectorClientId(connector);
  const clientSecret = getConnectorClientSecret(connector);
  const callbackUrl = getConnectorCallbackUrl(connector.connector.id);

  return { clientId, clientSecret, callbackUrl };
}

export function getConnectorCallbackUrl(connectorId: string): string {
  const callbackBaseUrl = process.env.MORPH_CALLBACK_BASE_URL;
  if (!callbackBaseUrl) {
    throw new Error("MORPH_CALLBACK_BASE_URL missing.");
  }
  return `${callbackBaseUrl}/callback/${connectorId}`;
}

export async function fetchOAuthToken(
  params: FetchOAuthTokenParams
): Promise<OAuthToken> {
  const { clientId, clientSecret, code, accessTokenUrl, callbackUrl } = params;

  const urlParams = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: callbackUrl,
  });

  const response = await axios.post(accessTokenUrl, urlParams.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...(params.headers || {}),
    },
  });

  return response.data;
}

export async function oautCallback<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _A extends Adapter,
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
>(
  morph: MorphClient<C>,
  { state, code }: AuthorizeParams
): Promise<
  EitherTypeOrError<{ connection: ConnectionData; redirectUrl: string }>
> {
  const { connectorId, ownerId, redirectUrl } = decryptJson(
    JSON.parse(state),
    true
  );

  const connection = morph.connections({
    connectorId,
    ownerId,
  });

  const { data: connectionData, error: connectionError } =
    await connection.retrieve();

  if (connectionError) {
    return { error: connectionError };
  }

  const { data: connectorData, error: connectorError } = await morph
    .connectors()
    .retrieve(connectorId);

  if (connectorError) {
    return { error: connectorError };
  }
  if (!connectorData.connector.auth.type.startsWith("oauth2")) {
    return {
      error: {
        code: "MORPH::CONNECTION::AUTH_TYPE_NOT_SUPPORTED",
        message: `Connector "${connectorData.connector.id}" is not set up for OAuth authorization flow.`,
      },
    };
  }

  const { clientId, clientSecret, callbackUrl } =
    getConnectorOAuthCredentials(connectorData);

  try {
    const urlAndHeaders =
      await connectorData.connector.auth.generateAccessTokenUrl({
        connector: {
          getSetting: async (key) => {
            const connectorOptions =
              morph.m_.connectors[connectorId as I].connector.getOptions();
            if (!connectorOptions) {
              return undefined;
            }
            return connectorOptions[
              key as keyof typeof connectorOptions
            ] as any;
          },
        },
        connection,
      });

    const tokenResponse = await fetchOAuthToken({
      clientId,
      clientSecret,
      code,
      accessTokenUrl: urlAndHeaders.url,
      callbackUrl,
      ...(urlAndHeaders.headers ? { headers: urlAndHeaders.headers } : {}),
    });

    if (tokenResponse.access_token) {
      try {
        const connector = morph.m_.connectors[connectorId as I];
        const onTokenExchanged =
          connector?.connector?.callbacks?.onTokenExchanged;
        if (onTokenExchanged) {
          await onTokenExchanged({
            connection,
            connector: {
              getSetting: async (key) => {
                const connectorOptions =
                  morph.m_.connectors[connectorId as I].connector.getOptions();
                if (!connectorOptions) {
                  return undefined;
                }
                return connectorOptions[
                  key as keyof typeof connectorOptions
                ] as any;
              },
            },
            rawTokens: tokenResponse,
          });
        }
      } catch (e) {
        console.error("Failed to execute cllbacks : onTokenExchanged", e);
      }
      const authorizationOAuthData: ConnectionAuthorizationOAuthData = {
        _accessToken: tokenResponse.access_token,
        _refreshToken: tokenResponse.refresh_token,
        expiresAt: tokenResponse.expires_at
          ? new Date(tokenResponse.expires_at * 1000).toISOString()
          : tokenResponse.expires_in
            ? new Date(
                Date.now() + tokenResponse.expires_in * 1000
              ).toISOString()
            : null,
        // new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      };

      let newAuthorizationStoredData: ConnectionAuthorizationStoredData = {};

      const currentConnectiondData =
        await morph.m_.database.adapter.retrieveConnection({
          connectorId: connectionData.connectorId,
          ownerId: connectionData.ownerId,
        });

      if (currentConnectiondData?.authorizationData) {
        const currentAuthorizationStoredData = JSON.parse(
          currentConnectiondData.authorizationData
        );

        newAuthorizationStoredData = currentAuthorizationStoredData;
      }

      newAuthorizationStoredData.oauth = authorizationOAuthData;

      const stringEncryptedAuthorizationStoredData = JSON.stringify(
        newAuthorizationStoredData
      );

      await morph.m_.database.adapter.updateConnection(
        {
          connectorId: connectionData.connectorId,
          ownerId: connectionData.ownerId,
        },
        {
          status: "authorized",
          authorizationData: stringEncryptedAuthorizationStoredData,
          updatedAt: new Date(),
        }
      );
      const { data: updatedConnection, error: updatedConnectionError } =
        await morph.connections({ connectorId, ownerId }).retrieve();
      if (updatedConnectionError) {
        return { error: updatedConnectionError };
      }

      return { connection: updatedConnection, redirectUrl };
    }

    await morph.m_.database.adapter.updateConnection(
      {
        connectorId: connectionData.connectorId,
        ownerId: connectionData.ownerId,
      },
      {
        status: "unauthorized",
        updatedAt: new Date(),
      }
    );
    const { data: unauthorizedConnection, error: unauthorizedConnectionError } =
      await morph.connections({ connectorId, ownerId }).retrieve();
    if (unauthorizedConnectionError) {
      return { error: unauthorizedConnectionError };
    }

    return { connection: unauthorizedConnection, redirectUrl };
  } catch (error) {
    morph.m_.logger?.error("Error authorizing connection", { error });
    return {
      error: {
        code: "MORPH::UNKNOWN_ERROR",
        message: "Connection couldn't be authorized. Details: " + error,
      },
    };
  }
}

export async function getAuthorizationHeader<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  A extends Adapter,
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
>({
  morph,
  connectorId,
  ownerId,
  logger,
  refreshToken,
}: {
  morph: MorphClient<C>;
  connectorId: I;
  ownerId: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  logger?: Logger;
  refreshToken?: boolean;
}): Promise<string | null> {
  const { data: connectorData, error: connectorError } = await morph
    .connectors()
    .retrieve(connectorId);
  if (connectorError) {
    throw connectorError;
  }

  if (!connectorData.connector.auth.type.startsWith("oauth2")) {
    return null; // No authorization needed for non-OAuth2 connectors
  }

  const connectionAdapter = await morph.m_.database.adapter.retrieveConnection({
    connectorId,
    ownerId,
  });

  if (!connectionAdapter) {
    throw {
      code: "MORPH::ADAPTER::CONNECTION_NOT_FOUND",
      message: "Connection couldn't be found from the database.",
    };
  }

  let authorizationData: ConnectionAuthorizationStoredData;
  try {
    authorizationData = decryptJson(
      JSON.parse(connectionAdapter.authorizationData!)
    ) as ConnectionAuthorizationStoredData;
  } catch (e) {
    throw {
      code: "MORPH::ADAPTER::AUTHORIZATION_DATA_INVALID",
      message:
        "Failed to decrypt or parse authorization data:" +
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (e as any).toString(),
    };
  }

  if (
    (authorizationData.oauth?.expiresAt &&
      isTokenExpired(new Date(authorizationData.oauth.expiresAt))) ||
    refreshToken
  ) {
    // logger?.trace("connection::auth_refresh");
    authorizationData = await refreshAccessToken(
      morph,
      connectorId,
      ownerId,
      authorizationData
    );
  }

  if (!authorizationData.oauth?._accessToken) {
    throw {
      code: "MORPH::CONNECTION::ACCESS_TOKEN_MISSIN",
      message: "Access token is missing from the authorization data.",
    };
  }

  return `Bearer ${authorizationData.oauth?._accessToken}`;
}

export async function refreshAccessToken<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  A extends Adapter,
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
>(
  morph: MorphClient<C>,
  connectorId: I,
  ownerId: string,
  authorizationData: ConnectionAuthorizationStoredData
): Promise<ConnectionAuthorizationStoredData> {
  const { data: connectorData, error: connectorError } = await morph
    .connectors()
    .retrieve(connectorId);

  if (connectorError) {
    throw connectorError;
  }

  if (!authorizationData.oauth?._refreshToken) {
    throw {
      code: "MORPH::CONNECTION::REFRESH_TOKEN_MISSIN",
      message: "Refresh token is missing and the access token has expired.",
    };
  }

  const clientId = getConnectorClientId(connectorData);
  const clientSecret = getConnectorClientSecret(connectorData);

  try {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: authorizationData.oauth?._refreshToken || "",
      client_id: clientId,
      client_secret: clientSecret,
    });
    const connection = morph.connections({
      connectorId,
      ownerId,
    });
    const urlAndHeaders =
      await connectorData.connector.auth.generateAccessTokenUrl({
        connector: {
          getSetting: async (key) => {
            const connectorOptions =
              morph.m_.connectors[connectorId as I].connector.getOptions();
            if (!connectorOptions) {
              return undefined;
            }
            return connectorOptions[
              key as keyof typeof connectorOptions
            ] as any;
          },
        },
        connection,
      });
    const response = await axios.post(urlAndHeaders.url, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...(urlAndHeaders.headers || {}),
      },
    });
    const newAuthorizationOAuthData: ConnectionAuthorizationOAuthData = {
      _accessToken: response.data.access_token,
      _refreshToken:
        response.data.refresh_token || authorizationData.oauth?._refreshToken,
      expiresAt: response.data.expires_in
        ? calculateExpiresAt(response.data.expires_in)
        : null,
      // new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    };

    let newAuthorizationStoredData: ConnectionAuthorizationStoredData = {};

    const currentConnectiondData =
      await morph.m_.database.adapter.retrieveConnection({
        connectorId: connectorId,
        ownerId: ownerId,
      });

    if (currentConnectiondData?.authorizationData) {
      const currentAuthorizationStoredData = JSON.parse(
        currentConnectiondData.authorizationData
      );

      newAuthorizationStoredData = currentAuthorizationStoredData;
    }

    newAuthorizationStoredData.oauth = newAuthorizationOAuthData;

    const stringEncryptedAuthorizationStoredData = JSON.stringify(
      newAuthorizationStoredData
    );

    const updatedConnection = await morph.m_.database.adapter.updateConnection(
      { connectorId, ownerId },
      {
        authorizationData: stringEncryptedAuthorizationStoredData,
        updatedAt: new Date(),
      }
    );

    return { ...authorizationData, oauth: newAuthorizationOAuthData };
  } catch (error) {
    throw {
      code: "MORPH::CONNECTION::REFRESHING_TOKEN_FAILED",
      message: `Failed to refresh access token. Details: ${JSON.stringify(
        error
      )}`,
    };
  }
}

function isTokenExpired(expiresAt: Date): boolean {
  const currentTime = new Date();
  const bufferTime = 30 * 1000;
  return currentTime.getTime() + bufferTime >= expiresAt.getTime();
}

function calculateExpiresAt(expiresIn: number): string {
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}

function getConnectorClientId(
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
  >
): string {
  const options = connector.connector.getOptions();
  if (!options) {
    throw {
      code: "MORPH::BAD_CONFIGURATION",
      message: `Connector client is not configured.`,
    };
  }
  const { clientId } = options;
  if (clientId) return clientId;

  const envClientId =
    process.env[`MORPH_${connector.connector.id.toUpperCase()}_CLIENT_ID`];
  if (!envClientId) {
    throw {
      code: "MORPH::BAD_CONFIGURATION",
      message: `MORPH_${connector.connector.id.toUpperCase()}_CLIENT_ID missing.`,
    };
  }
  return envClientId;
}

function getConnectorClientSecret(
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
  >
): string {
  const options = connector.connector.getOptions();
  if (!options) {
    throw {
      code: "MORPH::BAD_CONFIGURATION",
      message: `Connector client is not configured.`,
    };
  }
  const { clientSecret } = options;
  if (clientSecret) return clientSecret;

  const envClientSecret =
    process.env[`MORPH_${connector.connector.id.toUpperCase()}_CLIENT_SECRET`];
  if (!envClientSecret) {
    throw new Error(
      `MORPH_${connector.connector.id.toUpperCase()}_CLIENT_SECRET missing.`
    );
  }
  return envClientSecret;
}
