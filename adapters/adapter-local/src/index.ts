import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

import type { Adapter, AdapterConnection } from "@runmorph/core";

/**
 * Storage configuration for local connections
 * @private
 */
const STORAGE_CONFIG = {
  dir: join(homedir(), ".morph"),
  file: "connections.json",
};

/**
 * In-memory cache of connections
 * @private
 */
let connectionsCache = new Map<string, AdapterConnection>();

/**
 * Creates a composite key for storing connections
 * @private
 */
const createKey = (connectorId: string, ownerId: string): string =>
  `${connectorId}:${ownerId}`;

/**
 * Initializes the storage directory and loads existing connections
 * @private
 */
const initializeStorage = (): void => {
  // Create .morph directory if it doesn't exist
  if (!existsSync(STORAGE_CONFIG.dir)) {
    mkdirSync(STORAGE_CONFIG.dir, { recursive: true });
  }

  const storagePath = join(STORAGE_CONFIG.dir, STORAGE_CONFIG.file);

  // Load existing connections if any
  try {
    if (existsSync(storagePath)) {
      const data = readFileSync(storagePath, "utf8");
      const connections = JSON.parse(data);
      connectionsCache = new Map(Object.entries(connections));
    }
  } catch (error) {
    console.warn("Failed to load existing connections:", error);
    connectionsCache = new Map();
  }
};

/**
 * Persists connections to disk
 * @private
 */
const persistConnections = (): void => {
  try {
    const storagePath = join(STORAGE_CONFIG.dir, STORAGE_CONFIG.file);
    const data = Object.fromEntries(connectionsCache);
    writeFileSync(storagePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Failed to persist connections:", error);
  }
};

// Initialize storage when module is loaded
initializeStorage();

/**
 * Creates a local adapter for development and testing purposes.
 * Stores data in ~/.morph/connections.json for persistence between restarts.
 *
 * @returns An Adapter object with methods for connection operations
 * @example
 * ```typescript
 * import { LocalAdapter } from '@runmorph/adapter-local';
 *
 * const morph = Morph({
 *   database: { adapter: LocalAdapter() }
 * });
 * ```
 */
export function LocalAdapter(): Adapter {
  return {
    createConnection: async (data) => {
      const key = createKey(data.connectorId, data.ownerId);

      if (connectionsCache.has(key)) {
        throw new Error("Connection already exists");
      }

      const connection: AdapterConnection = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      connectionsCache.set(key, connection);
      persistConnections();

      return {
        ...connection,
        createdAt: new Date(connection.createdAt),
        updatedAt: new Date(connection.updatedAt),
      };
    },

    retrieveConnection: async ({ connectorId, ownerId }) => {
      const key = createKey(connectorId, ownerId);
      const connection = connectionsCache.get(key);

      if (!connection) {
        return null;
      }

      return {
        ...connection,
        createdAt: new Date(connection.createdAt),
        updatedAt: new Date(connection.updatedAt),
      };
    },

    updateConnection: async ({ connectorId, ownerId }, data) => {
      const key = createKey(connectorId, ownerId);
      const existing = connectionsCache.get(key);

      if (!existing) {
        throw new Error("Connection not found");
      }

      const updated: AdapterConnection = {
        ...existing,
        ...data,
        createdAt: existing.createdAt,
        updatedAt: new Date(),
      };

      connectionsCache.set(key, updated);
      persistConnections();

      return {
        ...updated,
        createdAt: new Date(updated.createdAt),
        updatedAt: new Date(updated.updatedAt),
      };
    },

    deleteConnection: async ({ connectorId, ownerId }) => {
      const key = createKey(connectorId, ownerId);
      connectionsCache.delete(key);
      persistConnections();
    },
  };
}
