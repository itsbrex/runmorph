import type {
  Adapter,
  AdapterConnection,
  AdapterWebhook,
} from "@runmorph/core";

/**
 * In-memory storage for connections
 * @private
 */
const connectionsStore = new Map<string, AdapterConnection>();

/**
 * In-memory storage for webhooks
 * @private
 */
const webhooksStore = new Map<string, AdapterWebhook>();

/**
 * Creates a composite key for storing connections
 * @private
 */
const createKey = (connectorId: string, ownerId: string): string =>
  `${connectorId}:${ownerId}`;

/**
 * Creates a composite key for storing webhooks
 * @private
 */
const createWebhookKey = (
  connectorId: string,
  ownerId: string,
  model: string,
  trigger: string
): string => `${connectorId}:${ownerId}:${model}:${trigger}`;

/**
 * Creates an in-memory adapter for quick prototyping and testing.
 * Note: Data is cleared when the server restarts.
 *
 * @returns An Adapter object with methods for connection operations
 * @example
 * ```typescript
 * import { MemoryAdapter } from '@runmorph/adapter-memory';
 *
 * const morph = Morph({
 *   database: { adapter: MemoryAdapter() }
 * });
 * ```
 */
export function MemoryAdapter(): Adapter {
  return {
    createConnection: async (data) => {
      const key = createKey(data.connectorId, data.ownerId);

      if (connectionsStore.has(key)) {
        throw new Error("Connection already exists");
      }

      const connection: AdapterConnection = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      connectionsStore.set(key, connection);
      return connection;
    },

    retrieveConnection: async ({ connectorId, ownerId }) => {
      const key = createKey(connectorId, ownerId);
      const connection = connectionsStore.get(key) || null;
      return connection;
    },

    updateConnection: async ({ connectorId, ownerId }, data) => {
      const key = createKey(connectorId, ownerId);
      const existing = connectionsStore.get(key);

      if (!existing) {
        throw new Error("Connection not found");
      }

      const updated: AdapterConnection = {
        ...existing,
        ...data,
        createdAt: existing.createdAt,
        updatedAt: new Date(),
      };

      connectionsStore.set(key, updated);
      return updated;
    },

    deleteConnection: async ({ connectorId, ownerId }) => {
      const key = createKey(connectorId, ownerId);
      connectionsStore.delete(key);
    },

    createWebhook: async (webhook) => {
      const key = createWebhookKey(
        webhook.connectorId,
        webhook.ownerId,
        webhook.model,
        webhook.trigger
      );

      if (webhooksStore.has(key)) {
        throw new Error("Webhook already exists");
      }

      const newWebhook: AdapterWebhook = {
        ...webhook,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      webhooksStore.set(key, newWebhook);
      return newWebhook;
    },

    retrieveWebhook: async ({ connectorId, ownerId, model, trigger }) => {
      const key = createWebhookKey(connectorId, ownerId, model, trigger);
      const webhook = webhooksStore.get(key) || null;
      return webhook;
    },

    retrieveWebhookByIdentifierKey: async (identifierKey) => {
      for (const webhook of webhooksStore.values()) {
        if (webhook.identifierKey === identifierKey) {
          return webhook;
        }
      }
      return null;
    },

    updateWebhook: async ({ connectorId, ownerId, model, trigger }, data) => {
      const key = createWebhookKey(connectorId, ownerId, model, trigger);
      const existing = webhooksStore.get(key);

      if (!existing) {
        throw new Error("Webhook not found");
      }

      const updated: AdapterWebhook = {
        ...existing,
        ...data,
        createdAt: existing.createdAt,
        updatedAt: new Date(),
      };

      webhooksStore.set(key, updated);
      return updated;
    },

    deleteWebhook: async ({ connectorId, ownerId, model, trigger }) => {
      const key = createWebhookKey(connectorId, ownerId, model, trigger);
      webhooksStore.delete(key);
    },
  };
}
