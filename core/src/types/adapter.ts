import type { ConnectionIds, Awaitable } from "@runmorph/cdk";

export type AdapterConnection = {
  connectorId: string;
  ownerId: string;
  status: string;
  operations: string[];
  authorizationType: string;
  authorizationData?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Adapter = {
  createConnection(connection: AdapterConnection): Awaitable<AdapterConnection>;
  retrieveConnection({
    connectorId,
    ownerId,
  }: ConnectionIds<string>): Awaitable<AdapterConnection | null>;
  updateConnection(
    { connectorId, ownerId }: ConnectionIds<string>,
    connection: Partial<AdapterConnection> & { updatedAt: Date },
  ): Awaitable<AdapterConnection>;
  deleteConnection({
    connectorId,
    ownerId,
  }: ConnectionIds<string>): Awaitable<void>;
};
