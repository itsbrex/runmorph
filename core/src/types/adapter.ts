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

export type AdapterWebhook = {
  connectorId: string;
  ownerId: string;
  id: string; // whk_xxxxxx
  type: string; // subscription | gloabl
  identifierKey?: string | null;
  model: string;
  trigger: string;
  redirectUrl?: string | null;
  meta?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Adapter = {
  // Connections
  createConnection(connection: AdapterConnection): Awaitable<AdapterConnection>;
  retrieveConnection({
    connectorId,
    ownerId,
  }: ConnectionIds<string>): Awaitable<AdapterConnection | null>;
  updateConnection(
    { connectorId, ownerId }: ConnectionIds<string>,
    connection: Partial<AdapterConnection> & {
      updatedAt: Date;
    }
  ): Awaitable<AdapterConnection>;
  deleteConnection({
    connectorId,
    ownerId,
  }: ConnectionIds<string>): Awaitable<void>;
  // Webhooks
  createWebhook(webhook: AdapterWebhook): Awaitable<AdapterWebhook>;
  retrieveWebhook({
    connectorId,
    ownerId,
    id,
  }: ConnectionIds<string> & { id: string }): Awaitable<AdapterWebhook | null>;
  retrieveWebhookByIdentifierKey(
    identifierKey: string
  ): Awaitable<AdapterWebhook | null>;
  updateWebhook(
    { connectorId, ownerId, id }: ConnectionIds<string> & { id: string },
    webhook: Partial<AdapterWebhook> & {
      updatedAt: Date;
    }
  ): Awaitable<AdapterWebhook>;
  deleteWebhook({
    connectorId,
    ownerId,
    id,
  }: ConnectionIds<string> & { id: string }): Awaitable<void>;
};
