import { ConnectorBundle, ResourceModelOperations } from "@runmorph/cdk";

export type GenerateAuthorizationUrlParams = {
  connector: ConnectorBundle<string, ResourceModelOperations>;
  ownerId: string;
  scopes?: string[];
  redirectUrl?: string;
};

export type CreateAuthorizationParams = {
  scopes?: string[];
  settings?: Record<string, string>;
  redirectUrl?: string;
};

export type ExchangeCodeForTokenParams = {
  connector: ConnectorBundle<string, ResourceModelOperations>;
  code: string;
};

export type RefreshAccessTokenParams = {
  connector: ConnectorBundle<string, ResourceModelOperations>;
  refreshToken: string;
};

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
};

export type AuthorizeParams = {
  type: "oauth";
  code: string;
  state: string;
};

export type FetchOAuthTokenParams = {
  clientId: string;
  clientSecret: string;
  code: string;
  accessTokenUrl: string;
  callbackUrl: string;
};

export type OAuthToken = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
};
