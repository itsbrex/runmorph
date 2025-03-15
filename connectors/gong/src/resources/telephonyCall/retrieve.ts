import { Retrieve } from "@runmorph/cdk";

import mapper, { type GongCall } from "./mapper";

export default new Retrieve({
  scopes: [
    "api:calls:read:basic",
    "api:calls:read:extensive",
    "api:calls:read:media-url",
  ],
  mapper,
  handler: async (connection, { id }) => {
    const { data, error } = await connection.proxy<{
      requestId: string;
      records: {
        totalRecords: number;
        currentPageSize: number;
        currentPageNumber: number;
      };
      calls: GongCall[];
    }>({
      method: "POST",
      path: "/v2/calls/extensive",
      data: {
        filter: {
          callIds: [id],
        },
        contentSelector: {
          exposedFields: {
            parties: true,
            interaction: {
              speakers: true,
            },
            media: true,
          },
        },
      },
    });

    if (error) {
      return { error };
    }

    if (!data.calls?.[0]) {
      return {
        error: {
          code: "CONNECTOR::OPERATION::RESOURCE_NOT_FOUND" as const,
          message: `Call not found in Gong for id ${id}`,
        },
      };
    }

    const call = data.calls[0];

    if (call.metaData.isPrivate) {
      return {
        error: {
          code: "CONNECTOR::OPERATION::RESOURCE_NOT_FOUND" as const,
          message: `Call is private in Gong for id ${id}`,
        },
      };
    }

    return call;
  },
});
