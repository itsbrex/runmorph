import type {
  Adapter,
  ConnectorBundle,
  MorphClient,
  ResourceClient,
  ResourceEvents,
  ResourceModelOperations,
  WebhookOperations,
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
  CA extends ConnectorBundle<
    string,
    ResourceModelOperations,
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>, string>
  >[],
  TResourceModelId extends Parameters<
    ReturnType<MorphClient<CA>["connections"]>["resources"]
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
    options?: Parameters<ResourceClient<any, any, TResourceModelId>["list"]>[0]
  ): Promise<ReturnType<ResourceClient<any, any, TResourceModelId>["list"]>> {
    return this.post<
      ReturnType<ResourceClient<any, any, TResourceModelId>["list"]>
    >(`s/resources/${String(this.resourceModelId)}`, {
      action: "list",
      data: options,
    });
  }

  async retrieve(
    id: string,
    options?: Parameters<
      ResourceClient<any, any, TResourceModelId>["retrieve"]
    >[1]
  ): Promise<
    ReturnType<ResourceClient<any, any, TResourceModelId>["retrieve"]>
  > {
    return this.post<
      ReturnType<ResourceClient<any, any, TResourceModelId>["retrieve"]>
    >(`s/resources/${String(this.resourceModelId)}`, {
      action: "retrieve",
      data: { id, ...options },
    });
  }

  async create(
    data: Parameters<ResourceClient<any, any, TResourceModelId>["create"]>[0]
  ): Promise<ReturnType<ResourceClient<any, any, TResourceModelId>["create"]>> {
    return this.post<
      ReturnType<ResourceClient<any, any, TResourceModelId>["create"]>
    >(`s/resources/${String(this.resourceModelId)}`, {
      action: "create",
      data,
    });
  }

  async update(
    id: string,
    data: Parameters<ResourceClient<any, any, TResourceModelId>["update"]>[1]
  ): Promise<ReturnType<ResourceClient<any, any, TResourceModelId>["update"]>> {
    return this.post<
      ReturnType<ResourceClient<any, any, TResourceModelId>["update"]>
    >(`s/resources/${String(this.resourceModelId)}`, {
      action: "update",
      data: { id, ...data },
    });
  }

  async delete(
    id: string
  ): Promise<ReturnType<ResourceClient<any, any, TResourceModelId>["delete"]>> {
    return this.post<
      ReturnType<ResourceClient<any, any, TResourceModelId>["delete"]>
    >(`s/resources/${String(this.resourceModelId)}`, {
      action: "delete",
      data: { id },
    });
  }
}

class WebhookNextClient<
  TConnectorBundleArray extends ConnectorBundle<
    string,
    ResourceModelOperations,
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>, string>
  >[],
> extends ApiClient {
  constructor(sessionToken: string, baseUrl: string) {
    super(baseUrl, sessionToken);
  }

  async create(
    params: Parameters<
      ReturnType<
        ReturnType<
          MorphClient<TConnectorBundleArray>["connections"]
        >["webhooks"]
      >["create"]
    >[0]
  ): Promise<
    ReturnType<
      ReturnType<
        ReturnType<
          MorphClient<TConnectorBundleArray>["connections"]
        >["webhooks"]
      >["create"]
    >
  > {
    return this.post("s/webhooks", {
      action: "create",
      data: params,
    });
  }
  /*
  async retrieve(
    id: string
  ): Promise<
    ReturnType<
      ReturnType<
        ReturnType<MorphClient<A, CA>["connections"]>["webhook"]
      >["retrieve"]
    >
  > {
    return this.post("s/webhooks", {
      action: "retrieve",
      data: { id },
    });
  }

  async delete(
    id: string
  ): Promise<
    ReturnType<
      ReturnType<
        ReturnType<MorphClient<A, CA>["connections"]>["webhook"]
      >["delete"]
    >
  > {
    return this.post("s/webhooks", {
      action: "delete",
      data: { id },
    });
  }*/
}

class ConnectionsNextClient<
  TConnectorBundleArray extends ConnectorBundle<
    string,
    ResourceModelOperations,
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>, string>
  >[],
> extends ApiClient {
  constructor(sessionToken: string, baseUrl: string) {
    super(baseUrl, sessionToken);
  }

  async authorize(
    options?: Parameters<
      ReturnType<MorphClient<TConnectorBundleArray>["connections"]>["authorize"]
    >[0]
  ): Promise<
    ReturnType<
      ReturnType<MorphClient<TConnectorBundleArray>["connections"]>["authorize"]
    >
  > {
    return this.post<
      ReturnType<
        ReturnType<
          MorphClient<TConnectorBundleArray>["connections"]
        >["authorize"]
      >
    >("s/connection", {
      action: "authorize",
      data: options,
    });
  }

  async retrieve(): Promise<
    ReturnType<
      ReturnType<MorphClient<TConnectorBundleArray>["connections"]>["retrieve"]
    >
  > {
    return this.post<
      ReturnType<
        ReturnType<
          MorphClient<TConnectorBundleArray>["connections"]
        >["retrieve"]
      >
    >("s/connection", {
      action: "retrieve",
    });
  }

  async delete(): Promise<
    ReturnType<
      ReturnType<MorphClient<TConnectorBundleArray>["connections"]>["delete"]
    >
  > {
    return this.post<
      ReturnType<
        ReturnType<MorphClient<TConnectorBundleArray>["connections"]>["delete"]
      >
    >("s/connection", {
      action: "delete",
    });
  }

  resources<
    TResourceModelId extends Parameters<
      ReturnType<MorphClient<TConnectorBundleArray>["connections"]>["resources"]
    >[0],
  >(
    resourceModelId: TResourceModelId
  ): ResourceNextClient<TConnectorBundleArray, TResourceModelId> {
    return new ResourceNextClient(
      resourceModelId,
      this.sessionToken!,
      this.baseUrl
    );
  }

  webhook(): WebhookNextClient<TConnectorBundleArray> {
    return new WebhookNextClient(this.sessionToken!, this.baseUrl);
  }
}

class MorphNextClient<
  TConnectorBundleArray extends ConnectorBundle<
    string,
    ResourceModelOperations,
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>, string>
  >[],
> extends ApiClient {
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  connections(options: {
    sessionToken: string;
  }): ConnectionsNextClient<TConnectorBundleArray> {
    return new ConnectionsNextClient<TConnectorBundleArray>(
      options.sessionToken,
      this.baseUrl
    );
  }
}

export function NextMorphClient<
  TMorphClient extends MorphClient<any>,
>(): MorphNextClient<TMorphClient extends MorphClient<infer CA> ? CA : never> {
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

  return new MorphNextClient<
    TMorphClient extends MorphClient<infer CA> ? CA : never
  >(baseUrl);
}
export type NextMorphClient = typeof NextMorphClient;
