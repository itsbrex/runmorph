import type { PrismaClient, Prisma } from "@prisma/client";
import { Adapter } from "../core/src/types";

/**
 * Creates a Prisma adapter for connection management.
 *
 * @param prisma - PrismaClient instance or its extended version
 * @returns An Adapter object with methods for connection operations
 */
export function PrismaAdapter(
  prisma: PrismaClient | ReturnType<PrismaClient["$extends"]>
): Adapter {
  const p = prisma as PrismaClient;

  return {
    /**
     * Creates a new connection.
     * @param data - Connection data
     * @returns Created connection with typed authorization
     */
    createConnection: async (data: Prisma.ConnectionCreateInput) => {
      const connection = await p.connection.create({ data });
      return formatConnection(connection);
    },

    /**
     * Retrieves a connection by ID.
     * @param id - Connection ID
     * @returns Retrieved connection with typed authorization or null if not found
     */
    retrieveConnection: async (id: string) => {
      const connection = await p.connection.findUnique({ where: { id } });
      return connection ? formatConnection(connection) : null;
    },

    /**
     * Updates a connection.
     * @param id - Connection ID
     * @param data - Connection data
     * @returns Updated connection with typed authorization
     */
    updateConnection: async (
      id: string,
      data: Prisma.ConnectionUpdateInput
    ) => {
      const connection = await p.connection.update({
        where: { id },
        data: data,
      });
      return formatConnection(connection);
    },
  };
}

/**
 * Formats a connection object to ensure authorization is typed correctly.
 * @param connection - Connection object from Prisma
 * @returns Formatted connection with typed authorization
 */
function formatConnection(connection: Prisma.ConnectionGetPayload<{}>) {
  return {
    ...connection,
    authorization: connection.authorization as Record<string, any>,
  };
}
