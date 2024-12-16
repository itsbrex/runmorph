import type {
  ConnectionCreateParams,
  ConnectorBundle,
  ResourceModelOperations,
  ConnectionIds,
  WebhookOperations,
  ResourceEvents,
  Settings,
} from "@runmorph/cdk";

type SessionConnectionParams<
  C extends ConnectorBundle<
    I,
    Settings,
    Settings,
    ResourceModelOperations,
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>, string>
  >[],
  I extends string,
> = ConnectionIds<I> & ConnectionCreateParams<C>;

export type SessionCreateParams<
  C extends ConnectorBundle<
    I,
    Settings,
    Settings,
    ResourceModelOperations,
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>, string>
  >[],
  I extends string,
> = {
  connection: SessionConnectionParams<C, I>;
} & {
  expiresIn?: number;
};

export type SessionData<
  C extends ConnectorBundle<
    I,
    Settings,
    Settings,
    ResourceModelOperations,
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>, string>
  >[],
  I extends string,
> = {
  object: "session";
  connection: SessionConnectionParams<C, I>;
  sessionToken: string;
  expiresAt: string;
};
