import type { PrismaClient } from "@prisma/client";
import type { Adapter } from "@runmorph/core";

/**
 * Creates a Prisma adapter for connection and webhook management.
 *
 * @param prisma - A PrismaClient instance or its extended version
 * @returns An Adapter instance with methods for managing connections and webhooks
 */
export function PrismaAdapter(
  prisma: PrismaClient | ReturnType<PrismaClient["$extends"]>
): Adapter {
  const p = prisma as PrismaClient;

  return {
    /**
     * Creates a new connection in the database.
     *
     * @param data - The connection data to be stored
     * @returns A Promise that resolves to the created connection
     */
    createConnection: (data) => {
      return p.connection.create({
        data,
      });
    },

    /**
     * Retrieves a connection by its connector and owner IDs.
     *
     * @param params - The connection identifier parameters
     * @param params.connectorId - The unique identifier of the connector
     * @param params.ownerId - The unique identifier of the owner
     * @returns A Promise that resolves to the found connection or null if not found
     */
    retrieveConnection: ({ connectorId, ownerId }) => {
      return p.connection.findUnique({
        where: {
          connectorId_ownerId: {
            connectorId,
            ownerId,
          },
        },
      });
    },

    /**
     * Updates an existing connection's data.
     *
     * @param params - The connection identifier parameters
     * @param params.connectorId - The unique identifier of the connector
     * @param params.ownerId - The unique identifier of the owner
     * @param data - The partial connection data to update
     * @returns A Promise that resolves to the updated connection
     */
    updateConnection: ({ connectorId, ownerId }, data) => {
      return p.connection.update({
        where: {
          connectorId_ownerId: {
            connectorId,
            ownerId,
          },
        },
        data,
      });
    },

    /**
     * Deletes a connection from the database.
     *
     * @param params - The connection identifier parameters
     * @param params.connectorId - The unique identifier of the connector
     * @param params.ownerId - The unique identifier of the owner
     * @returns A Promise that resolves when the connection is deleted
     */
    deleteConnection: ({ connectorId, ownerId }) => {
      p.connection.delete({
        where: {
          connectorId_ownerId: {
            connectorId,
            ownerId,
          },
        },
      });
    },

    /**
     * Creates a new webhook in the database.
     *
     * @param data - The webhook data to be stored
     * @returns A Promise that resolves to the created webhook
     */
    createWebhook: (data) => {
      return p.webhook.create({
        data,
      });
    },

    /**
     * Retrieves a webhook by its composite ID.
     *
     * @param params - The webhook identifier parameters
     * @param params.connectorId - The unique identifier of the connector
     * @param params.ownerId - The unique identifier of the owner
     * @param params.id - The unique identifier of the webhook
     * @returns A Promise that resolves to the found webhook or null if not found
     */
    retrieveWebhook: ({ connectorId, ownerId, id }) => {
      return p.webhook.findUnique({
        where: {
          connectorId_ownerId_id: {
            id,
            connectorId,
            ownerId,
          },
        },
      });
    },

    /**
     * Retrieves a webhook by its identifier key.
     *
     * @param identifierKey - The unique identifier key of the webhook
     * @returns A Promise that resolves to the found webhook or null if not found
     */
    retrieveWebhookByIdentifierKey: (identifierKey) => {
      return p.webhook.findUnique({
        where: {
          identifierKey,
        },
      });
    },

    /**
     * Updates an existing webhook's data.
     *
     * @param params - The webhook identifier parameters
     * @param params.connectorId - The unique identifier of the connector
     * @param params.ownerId - The unique identifier of the owner
     * @param params.id - The unique identifier of the webhook
     * @param data - The partial webhook data to update
     * @returns A Promise that resolves to the updated webhook
     */
    updateWebhook: ({ connectorId, ownerId, id }, data) => {
      return p.webhook.update({
        where: {
          connectorId_ownerId_id: {
            connectorId,
            ownerId,
            id,
          },
        },
        data,
      });
    },

    /**
     * Deletes a webhook from the database.
     *
     * @param params - The webhook identifier parameters
     * @param params.connectorId - The unique identifier of the connector
     * @param params.ownerId - The unique identifier of the owner
     * @param params.id - The unique identifier of the webhook
     * @returns A Promise that resolves when the webhook is deleted
     */
    deleteWebhook: ({ connectorId, ownerId, id }) => {
      p.webhook.delete({
        where: {
          connectorId_ownerId_id: {
            connectorId,
            ownerId,
            id,
          },
        },
      });
    },
  };
}
