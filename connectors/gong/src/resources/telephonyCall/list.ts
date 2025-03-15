import { List } from "@runmorph/cdk";

import mapper, { type GongCall } from "./mapper";

interface GongCallListResponse {
  requestId: string;
  records: {
    totalRecords: number;
    currentPageSize: number;
    currentPageNumber: number;
    cursor: string;
  };
  calls: GongCall[];
}

export default new List({
  scopes: [
    "api:calls:read:basic",
    "api:calls:read:extensive",
    "api:calls:read:media-url",
  ],
  mapper,
  handler: async (connection, { limit, cursor }) => {
    const { data, error } = await connection.proxy<GongCallListResponse>({
      method: "POST",
      path: "/v2/calls/extensive",
      data: {
        cursor: cursor || undefined,
        filter: {},
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

    const filteredCalls = data.calls.filter((call) => !call.metaData.isPrivate);

    return {
      data: filteredCalls,
      next: data.records.cursor || null,
    };
  },
});
