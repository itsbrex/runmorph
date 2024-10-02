export type ConnectionIds<I extends string> = {
  connectorId: I;
  ownerId: string;
};
export type ConnectionCreateParams = {
  operations?: string[];
};

export type ConnectionUpdateParams = Partial<ConnectionCreateParams>;

export type ConnectionAuthorizationData = {
  object: "connection.authorization";
  connectorId: string;
  ownerId: string;
  status: string;
  authorizationUrl?: string;
  scopes?: string[];
  settings?: Record<string, string>;
  oauth?: ConnectionAuthorizationOAuthData;
};

export type ConnectionAuthorizationStoredData = {
  scopes?: string[];
  settings?: Record<string, string>;
  oauth?: ConnectionAuthorizationOAuthData;
};

export type ConnectionData = {
  object: "connection";
  connectorId: string;
  ownerId: string;
  status: string;
  operations: string[];
  createdAt: string;
  updatedAt: string;
};

export type ConnectionAuthorizationOAuthData = {
  _accessToken: string;
  _refreshToken?: string | null;
  expiresAt?: string | null;
};

export type ConnectionCallbackData = {
  connection: ConnectionData;
  redirectUrl?: string;
};

export interface ConnectionListParams {
  limit?: number;
  filter?: {
    status?: string;
    [key: string]: unknown;
  };
  cursor?: string;
  sort?: string;
  iterator?: boolean;
}

export interface ConnectionListResponse {
  object: "list";
  data: ConnectionData[];
  next?: string;
}

export type ConnectionProxyParams = {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  data?: unknown;
  query?: Record<string, unknown>;
  headers?: Record<string, string>;
};
