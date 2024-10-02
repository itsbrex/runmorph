import { ConnectionIds } from "./connection";
import { Awaitable } from "./utils";

export type AdapterConnection = {
  connectorId: string;
  ownerId: string;
  status: string;
  operations: string[];
  authorizationType: string;
  authorizationData?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Adapter = {
  createConnection(connection: AdapterConnection): Awaitable<AdapterConnection>;
  retrieveConnection({
    connectorId,
    ownerId,
  }: ConnectionIds<string>): Awaitable<AdapterConnection | null>;
  updateConnection(
    { connectorId, ownerId }: ConnectionIds<string>,
    connection: Partial<AdapterConnection> & { updatedAt: string },
  ): Awaitable<AdapterConnection>;
  deleteConnection({
    connectorId,
    ownerId,
  }: ConnectionIds<string>): Awaitable<void>;
};
