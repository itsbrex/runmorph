import type { PrismaClient } from "@prisma/client";
import type { Adapter } from "@runmorph/core";

/**
 * Creates a Prisma adapter for connection management.
 *
 * @param prisma - PrismaClient instance or its extended version
 * @returns An Adapter object with methods for connection operations
 */
export function PrismaAdapter(
  prisma: PrismaClient | ReturnType<PrismaClient["$extends"]>,
): Adapter {
  const p = prisma as PrismaClient;

  return {
    /**
     * Creates a new connection.
     * @param data - Connection data
     * @returns Created connection
     */
    createConnection: (data) => {
      return p.connection.create({
        data: {
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    },

    /**
     * Retrieves a connection by ID.
     * @param id - Connection ID
     * @returns Retrieved connection
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
     * Updates a connection.
     * @param id - Connection ID
     * @param data - Partial Connection data
     * @returns Updated connection
     */
    updateConnection: ({ connectorId, ownerId }, data) => {
      return p.connection.update({
        where: {
          connectorId_ownerId: {
            connectorId,
            ownerId,
          },
        },
        data: { ...data, updatedAt: new Date().toISOString() },
      });
    },

    /**
     * Deletes a connection.
     * @param connectorId - Connector ID
     * @param ownerId - Owner ID
     * @returns void
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
  };
}
