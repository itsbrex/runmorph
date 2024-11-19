import type {
  ConnectionCreateParams,
  ConnectorBundle,
  ResourceModelOperations,
  ConnectionIds,
} from "@runmorph/cdk";

type SessionConnectionParams<
  C extends ConnectorBundle<I, ResourceModelOperations>[],
  I extends string,
> = ConnectionIds<I> & ConnectionCreateParams<C>;

export type SessionCreateParams<
  C extends ConnectorBundle<I, ResourceModelOperations>[],
  I extends string,
> = {
  connection: SessionConnectionParams<C, I>;
} & {
  expiresIn?: number;
};

export type SessionData<
  C extends ConnectorBundle<I, ResourceModelOperations>[],
  I extends string,
> = {
  object: "session";
  connection: SessionConnectionParams<C, I>;
  sessionToken: string;
  expiresAt: string;
};
