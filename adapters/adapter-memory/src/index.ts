import type { Adapter, AdapterConnection } from "@runmorph/core";

/**
 * In-memory storage for connections
 * @private
 */
const connectionsStore = new Map<string, AdapterConnection>();

/**
 * Creates a composite key for storing connections
 * @private
 */
const createKey = (connectorId: string, ownerId: string): string =>
  `${connectorId}:${ownerId}`;

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
  };
}
