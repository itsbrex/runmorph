import { Retrieve } from "@runmorph/cdk";

import mapper, { type DialpadCallTranscript } from "./mapper";

export default new Retrieve({
  scopes: ["api:transcripts:read"],
  mapper,
  handler: async (connection, { id }) => {
    const { data, error } = await connection.proxy<DialpadCallTranscript>({
      method: "GET",
      path: `/v2/transcripts/${id}`,
    });

    if (error) {
      return { error };
    }

    if (!data) {
      return {
        error: {
          code: "CONNECTOR::OPERATION::RESOURCE_NOT_FOUND" as const,
          message: `No transcript found for call ID: ${id}`,
        },
      };
    }

    return data;
  },
});
