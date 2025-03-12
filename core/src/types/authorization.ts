import {
  ConnectorBundle,
  ResourceEvents,
  ResourceModelOperations,
  Settings,
  WebhookOperations,
} from "@runmorph/cdk";

export type GenerateAuthorizationUrlParams = {
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
  >;
  ownerId: string;
  scopes?: string[];
  settings?: Record<string, string>;
  redirectUrl?: string;
};

export type CreateAuthorizationParams = {
  scopes?: string[];
  settings?: Record<string, string>;
  redirectUrl?: string;
};

export type ExchangeCodeForTokenParams = {
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
  >;
  code: string;
};

export type RefreshAccessTokenParams = {
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
  >;
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

export type AuthorizeHadleParams = {
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
