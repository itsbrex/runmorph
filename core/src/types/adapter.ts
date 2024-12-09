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
  model: string;
  trigger: string;
  type: string; // subscription | global
  identifierKey?: string | null;
  meta?: string | null;
  //redirectUrl?: string | null;
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
    model,
    trigger,
  }: ConnectionIds<string> & {
    model: string;
    trigger: string;
  }): Awaitable<AdapterWebhook | null>;
  retrieveWebhookByIdentifierKey(
    identifierKey: string
  ): Awaitable<AdapterWebhook | null>;
  updateWebhook(
    {
      connectorId,
      ownerId,
      model,
      trigger,
    }: ConnectionIds<string> & {
      model: string;
      trigger: string;
    },
    webhook: Partial<AdapterWebhook> & {
      updatedAt: Date;
    }
  ): Awaitable<AdapterWebhook>;
  deleteWebhook({
    connectorId,
    ownerId,
    model,
    trigger,
  }: ConnectionIds<string> & {
    model: string;
    trigger: string;
  }): Awaitable<void>;
};
