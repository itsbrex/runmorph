import axios from "axios";
import { Connector } from "../types";
import { encryptState } from "./encryption";

export function generateAuthorizationUrl({
  connector,
  connectionId,
  scopes,
}: {
  connector: Connector;
  connectionId: string;
  scopes?: string[];
}): string {
  const clientId = getConnectorClientId(connector.id);
  const redirectUri = getConnectorCallbackUrl(connector.id);
  const state = encryptState({
    connectionId,
    timestamp: Date.now(),
  });
  const url = new URL(connector.authorization.authorizeUrl);
  url.searchParams.append("client_id", clientId);
  url.searchParams.append("redirect_uri", redirectUri);
  url.searchParams.append("state", state);
  url.searchParams.append("response_type", "code");
  if (scopes) {
    url.searchParams.append("scope", scopes.join(","));
  }
  return url.toString();
}

export async function exchangeCodeForToken({
  connector,
  code,
}: {
  connector: Connector;
  code: string;
}): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}> {
  const clientId = getConnectorClientId(connector.id);
  const clientSecret = getConnectorClientSecret(connector.id);
  const redirectUri = getConnectorCallbackUrl(connector.id);
  const response = await axios.post(
    connector.authorization.accessTokenUrl,
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
      },
    }
  );

  return response.data;
}

export async function refreshAccessToken({
  connector,
  refreshToken,
}: {
  connector: Connector;
  refreshToken: string;
}): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}> {
  const clientId = getConnectorClientId(connector.id);
  const clientSecret = getConnectorClientSecret(connector.id);
  const response = await axios.post(
    connector.authorization.accessTokenUrl,
    {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    },
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data;
}

export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() >= expiresAt;
}

export function calculateExpiresAt(expiresIn: number): Date {
  return new Date(Date.now() + expiresIn * 1000);
}

export function getConnectorClientId(connectorId: string): string {
  const clientId = process.env[`MORPH_${connectorId.toUpperCase()}_CLIENT_ID`];
  if (!clientId) {
    throw new Error(`MORPH_${connectorId.toUpperCase()}_CLIENT_ID missing.`);
  }
  return clientId;
}

export function getConnectorClientSecret(connectorId: string): string {
  const clientSecret =
    process.env[`MORPH_${connectorId.toUpperCase()}_CLIENT_SECRET`];
  if (!clientSecret) {
    throw new Error(
      `MORPH_${connectorId.toUpperCase()}_CLIENT_SECRET missing.`
    );
  }
  return clientSecret;
}

export function getConnectorCallbackUrl(connectorId: string): string {
  const callbackBaseUrl = process.env.MORPH_CALLBACK_BASE_URL;
  if (!callbackBaseUrl) {
    throw new Error("MORPH_CALLBACK_BASE_URL missing.");
  }
  return `${callbackBaseUrl}/${connectorId}/callback`;
}
