import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

import { DialpadCall } from "../telephonyCall/mapper";

/**
 * Type definition for Dialpad Call Transcript API response
 */
export type DialpadCallTranscript = {
  call_id: string;
  call: DialpadCall;
  lines: Array<{
    content: string;
    name: string;
    time: string;
    type: "transcript" | "moment";
    user_id?: string;
    contact_id?: string;
  }>;
};

/**
 * Type for speaker origin
 */
type SpeakerOrigin = "internal" | "external" | "unknown";

/**
 * Converts ISO string to Date
 */
const parseDate = (dateStr: string): Date => new Date(dateStr);

/**
 * Maps Dialpad call transcript data to the standardized telephony call transcript model
 */
export default new Mapper<
  ResourceModels["telephonyCallTranscript"],
  DialpadCallTranscript
>({
  id: {
    read: (from) => from("call_id"),
  },
  fields: {
    call: {
      read: (from) => ({
        id: from("call_id", (callId) => ({ id: callId })),
      }),
    },
    duration: {
      read: (from) =>
        from("lines", (lines) => {
          if (!lines?.length) return 0;
          const firstTime = parseDate(lines[0].time).getTime();
          const lastTime = parseDate(lines[lines.length - 1].time).getTime();
          return Math.round((lastTime - firstTime) / 1000);
        }),
    },
    segments: {
      read: (from) =>
        from("lines", (lines) => {
          if (!lines?.length) return [];

          const transcriptLines = lines.filter(
            (line) => line.type === "transcript"
          );
          const firstLineTime = parseDate(transcriptLines[0].time).getTime();

          return transcriptLines.map((line, index) => {
            const start = parseDate(line.time).getTime();
            const end =
              index < transcriptLines.length - 1
                ? parseDate(transcriptLines[index + 1].time).getTime()
                : start;

            const relativeStart = (start - firstLineTime) / 1000;
            const relativeEnd = (end - firstLineTime) / 1000;

            return {
              start: relativeStart,
              end: relativeEnd,
              text: line.content,
              speakerId: line.user_id || line.contact_id || "unknown",
            };
          });
        }),
    },
    speakers: {
      read: (from) =>
        from("lines", (lines) => {
          if (!lines?.length) return [];

          const speakers = new Map<
            string,
            {
              id: string;
              origin: SpeakerOrigin;
              name?: string;
              user?: { id: string };
              contact?: { id: string };
            }
          >();

          for (const line of lines) {
            const speakerId = line.user_id || line.contact_id || "unknown";
            if (!speakers.has(speakerId)) {
              speakers.set(speakerId, {
                id: speakerId,
                origin: line.user_id
                  ? "internal"
                  : line.contact_id
                    ? "external"
                    : "unknown",
                ...(line.name && { name: line.name }),
                ...(line.user_id && { user: { id: line.user_id } }),
                ...(line.contact_id && { contact: { id: line.contact_id } }),
              });
            }
          }

          return Array.from(speakers.values());
        }),
    },
  },
  createdAt: {
    read: (from) =>
      from("call.date_started", (date) =>
        date ? new Date(Number(date)) : new Date()
      ),
  },
  updatedAt: {
    read: (from) =>
      from("call.date_started", (date) =>
        date ? new Date(Number(date)) : new Date()
      ),
  },
});
