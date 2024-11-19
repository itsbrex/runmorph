import type {
  Adapter,
  ConnectorBundle,
  MorphClient,
  ResourceClient,
  ResourceModelOperations,
} from "@runmorph/core";

interface ApiRequestPayload<TData = unknown> {
  action: string;
  data?: TData;
}

class ApiClient {
  protected baseUrl: string;
  protected sessionToken?: string;

  constructor(baseUrl: string, sessionToken?: string) {
    this.baseUrl = baseUrl;
    this.sessionToken = sessionToken;
  }

  protected async post<TResponse, TData = unknown>(
    endpoint: string,
    payload: ApiRequestPayload<TData>
  ): Promise<TResponse> {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.sessionToken && {
          Authorization: `Bearer ${this.sessionToken}`,
        }),
      },
      body: JSON.stringify(payload),
    });

    return response.json();
  }
}

class ResourceNextClient<
  A extends Adapter,
  CA extends ConnectorBundle<string, ResourceModelOperations>[],
  TResourceModelId extends Parameters<
    ReturnType<MorphClient<A, CA>["connections"]>["resources"]
  >[0],
> extends ApiClient {
  private resourceModelId: TResourceModelId;

  constructor(
    resourceName: TResourceModelId,
    sessionToken: string,
    baseUrl: string
  ) {
    super(baseUrl, sessionToken);
    this.resourceModelId = resourceName;
  }

  async list(
    options?: Parameters<
      ResourceClient<any, any, any, TResourceModelId>["list"]
    >[0]
  ): Promise<
    ReturnType<ResourceClient<any, any, any, TResourceModelId>["list"]>
  > {
    return this.post<
      ReturnType<ResourceClient<any, any, any, TResourceModelId>["list"]>
    >(`s/resources/${String(this.resourceModelId)}`, {
      action: "list",
      data: options,
    });
  }

  async retrieve(
    id: string,
    options?: Parameters<
      ResourceClient<any, any, any, TResourceModelId>["retrieve"]
    >[1]
  ): Promise<
    ReturnType<ResourceClient<any, any, any, TResourceModelId>["retrieve"]>
  > {
    return this.post<
      ReturnType<ResourceClient<any, any, any, TResourceModelId>["retrieve"]>
    >(`s/resources/${String(this.resourceModelId)}`, {
      action: "retrieve",
      data: { id, ...options },
    });
  }

  async create(
    data: Parameters<
      ResourceClient<any, any, any, TResourceModelId>["create"]
    >[0]
  ): Promise<
    ReturnType<ResourceClient<any, any, any, TResourceModelId>["create"]>
  > {
    return this.post<
      ReturnType<ResourceClient<any, any, any, TResourceModelId>["create"]>
    >(`s/resources/${String(this.resourceModelId)}`, {
      action: "create",
      data,
    });
  }

  async update(
    id: string,
    data: Parameters<
      ResourceClient<any, any, any, TResourceModelId>["update"]
    >[1]
  ): Promise<
    ReturnType<ResourceClient<any, any, any, TResourceModelId>["update"]>
  > {
    return this.post<
      ReturnType<ResourceClient<any, any, any, TResourceModelId>["update"]>
    >(`s/resources/${String(this.resourceModelId)}`, {
      action: "update",
      data: { id, ...data },
    });
  }

  async delete(
    id: string
  ): Promise<
    ReturnType<ResourceClient<any, any, any, TResourceModelId>["delete"]>
  > {
    return this.post<
      ReturnType<ResourceClient<any, any, any, TResourceModelId>["delete"]>
    >(`s/resources/${String(this.resourceModelId)}`, {
      action: "delete",
      data: { id },
    });
  }
}

class ConnectionsNextClient<
  A extends Adapter,
  CA extends ConnectorBundle<string, ResourceModelOperations>[],
> extends ApiClient {
  constructor(sessionToken: string, baseUrl: string) {
    super(baseUrl, sessionToken);
  }

  async authorize(
    options?: Parameters<
      ReturnType<MorphClient<A, CA>["connections"]>["authorize"]
    >[0]
  ): Promise<
    ReturnType<ReturnType<MorphClient<A, CA>["connections"]>["authorize"]>
  > {
    return this.post<
      ReturnType<ReturnType<MorphClient<A, CA>["connections"]>["authorize"]>
    >("s/connection", {
      action: "authorize",
      data: options,
    });
  }

  async retrieve(): Promise<
    ReturnType<ReturnType<MorphClient<A, CA>["connections"]>["retrieve"]>
  > {
    return this.post<
      ReturnType<ReturnType<MorphClient<A, CA>["connections"]>["retrieve"]>
    >("s/connection", {
      action: "retrieve",
    });
  }

  async delete(): Promise<
    ReturnType<ReturnType<MorphClient<A, CA>["connections"]>["delete"]>
  > {
    return this.post<
      ReturnType<ReturnType<MorphClient<A, CA>["connections"]>["delete"]>
    >("s/connection", {
      action: "delete",
    });
  }

  resources<
    TResourceModelId extends Parameters<
      ReturnType<MorphClient<A, CA>["connections"]>["resources"]
    >[0],
  >(
    resourceModelId: TResourceModelId
  ): ResourceNextClient<A, CA, TResourceModelId> {
    return new ResourceNextClient(
      resourceModelId,
      this.sessionToken!,
      this.baseUrl
    );
  }
}

class MorphNextClient<
  A extends Adapter,
  CA extends ConnectorBundle<string, ResourceModelOperations>[],
> extends ApiClient {
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  connections(options: { sessionToken: string }): ConnectionsNextClient<A, CA> {
    return new ConnectionsNextClient<A, CA>(options.sessionToken, this.baseUrl);
  }
}

export function NextMorphClient<
  TMorphClient extends MorphClient<any, any>,
>(): MorphNextClient<
  TMorphClient extends MorphClient<infer A, any> ? A : never,
  TMorphClient extends MorphClient<any, infer CA> ? CA : never
> {
  const baseUrl =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_MORPH_API_BASE_URL) ||
    (typeof window !== "undefined" && window.location.origin) ||
    "";

  if (!baseUrl) {
    throw new Error(
      "Could not determine API base URL. Please set NEXT_PUBLIC_MORPH_API_BASE_URL environment variable"
    );
  }

  type ExtractAdapter<T> = T extends MorphClient<infer A, any> ? A : never;
  type ExtractConnectorBundle<T> =
    T extends MorphClient<any, infer CA> ? CA : never;

  return new MorphNextClient<
    ExtractAdapter<TMorphClient>,
    ExtractConnectorBundle<TMorphClient>
  >(baseUrl);
}
export type NextMorphClient = typeof NextMorphClient;
