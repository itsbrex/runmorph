import { Retrieve } from "@runmorph/cdk";

import mapper, { type GongCallTranscript } from "./mapper";

/**
 * Retrieve operation for Gong call transcripts
 * Fetches both call parties information and transcript data
 */
export default new Retrieve({
  scopes: [
    "api:calls:read:transcript",
    "api:calls:read:basic",
    "api:calls:read:extensive",
  ],
  mapper,
  handler: async (connection, { id }) => {
    // First get transcript
    const { data: transcriptData, error: transcriptError } =
      await connection.proxy<{
        callTranscripts: Array<GongCallTranscript>;
      }>({
        method: "POST",
        path: "/v2/calls/transcript",
        data: {
          filter: {
            callIds: [id],
          },
        },
      });

    if (transcriptError) {
      return { error: transcriptError };
    }

    // If no transcript data is found, return an empty transcript
    // This can happen for calls that don't have transcripts yet
    const transcript = transcriptData?.callTranscripts?.[0] || {
      callId: id,
      transcript: [],
    };

    // Then get parties info
    const { data: partiesData, error: partiesError } = await connection.proxy<{
      calls: Array<{
        parties: GongCallTranscript["parties"];
        metaData: {
          started: string;
        };
      }>;
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
            metaData: true,
          },
        },
      },
    });

    if (partiesError) {
      return { error: partiesError };
    }

    if (!partiesData?.calls?.length) {
      return {
        error: partiesError || {
          code: "CONNECTOR::OPERATION::RESOURCE_NOT_FOUND" as const,
          message: `No call found with ID: ${id}`,
        },
      };
    }

    const parties = partiesData.calls[0]?.parties || [];
    const started = partiesData.calls[0]?.metaData?.started;

    // Return combined data
    return {
      ...transcript,
      parties,
      started: started ? new Date(started) : undefined,
    };
  },
});
