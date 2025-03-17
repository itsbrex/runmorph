import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

/**
 * Type definition for Aircall Call Transcript API response
 */
export type AircallCallTranscript = {
  id: number;
  call_id: number;
  call_created_at: string;
  type: string;
  content: {
    language: string;
    utterances: Array<{
      start_time: number;
      end_time: number;
      text: string;
      participant_type: "internal" | "external";
      participant_name?: string;
      user_id?: number;
      contact_id?: number;
      phone_number?: string;
    }>;
  };
};

/**
 * Type for speaker origin
 */
type SpeakerOrigin = "internal" | "external" | "unknown";

/**
 * Converts milliseconds to seconds, rounding to the nearest integer
 */
const msToSeconds = (ms: number): number => Math.round(ms);

/**
 * Determines the speaker ID from utterance data
 */
const getSpeakerId = (
  utterance: AircallCallTranscript["content"]["utterances"][0]
): string => {
  return (
    utterance.user_id?.toString() ||
    utterance.contact_id?.toString() ||
    utterance.phone_number ||
    "unknown"
  );
};

/**
 * Maps Aircall call transcript data to the standardized telephony call transcript model
 */
export default new Mapper<
  ResourceModels["telephonyCallTranscript"],
  AircallCallTranscript
>({
  id: {
    read: (from) => from("call_id", String),
  },
  fields: {
    call: {
      read: (from) => ({
        id: from("call_id", (callId) => ({
          id: String(callId),
        })),
      }),
    },
    duration: {
      read: (from) =>
        from("content.utterances", (utterances) => {
          if (!utterances?.length) return 0;
          const lastUtterance = utterances[utterances.length - 1];
          return msToSeconds(lastUtterance.end_time);
        }),
    },
    segments: {
      read: (from) =>
        from("content.utterances", (utterances) => {
          if (!utterances) return [];

          return utterances.map((utterance) => ({
            start: utterance.start_time,
            end: utterance.end_time,
            text: utterance.text,
            speakerId: getSpeakerId(utterance),
          }));
        }),
    },
    speakers: {
      read: (from) =>
        from("content.utterances", (utterances) => {
          if (!utterances) return [];

          const speakers = new Map<
            string,
            {
              id: string;
              origin: SpeakerOrigin;
              name?: string;
              user?: { id: string };
              phone?: string;
              contact?: { id: string };
            }
          >();

          for (const utterance of utterances) {
            const speakerId = getSpeakerId(utterance);

            if (!speakers.has(speakerId)) {
              speakers.set(speakerId, {
                id: speakerId,
                origin: utterance.participant_type || "unknown",
                ...(utterance.participant_name && {
                  name: utterance.participant_name,
                }),
                ...(utterance.user_id && {
                  user: { id: String(utterance.user_id) },
                }),
                ...(utterance.phone_number && {
                  phone: utterance.phone_number,
                }),
                ...(utterance.contact_id && {
                  contact: { id: String(utterance.contact_id) },
                }),
              });
            }
          }

          return Array.from(speakers.values());
        }),
    },
  },
  createdAt: {
    read: (from) => from("call_created_at", (date) => new Date(date)),
  },
  updatedAt: {
    read: (from) => from("call_created_at", (date) => new Date(date)),
  },
});
