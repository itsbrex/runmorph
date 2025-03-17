import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

/**
 * Type definition for Gong Call Transcript API response
 */
export type GongCallTranscript = {
  callId: string;
  transcript: Array<{
    speakerId: string;
    topic: string | null;
    sentences: Array<{
      start: number;
      end: number;
      text: string;
    }>;
  }>;
  parties: Array<{
    id: string;
    emailAddress: string;
    name: string;
    userId: string;
    speakerId: string;
    affiliation: "Internal" | "External";
    phoneNumber: string;
    methods: string[];
  }>;
  started?: Date;
};

/**
 * Type for speaker origin
 */
type SpeakerOrigin = "internal" | "external" | "unknown";

/**
 * Converts milliseconds to seconds, rounding to the nearest integer
 */
const msToSeconds = (ms: number, rounded: boolean = false): number => {
  const seconds = ms / 1000;
  return rounded ? Math.round(seconds) : seconds;
};

/**
 * Maps Gong call transcript data to the standardized telephony call transcript model
 */
export default new Mapper<
  ResourceModels["telephonyCallTranscript"],
  GongCallTranscript
>({
  id: {
    read: (from) => from("callId"),
  },
  fields: {
    call: {
      read: (from) => ({
        id: from("callId", (callId) => ({ id: callId })),
      }),
    },
    duration: {
      read: (from) =>
        from("transcript", (transcript) => {
          if (!transcript?.length) return 0;

          let maxEnd = 0;
          for (const speaker of transcript) {
            if (!speaker.sentences?.length) continue;

            for (const sentence of speaker.sentences) {
              if (sentence.end > maxEnd) {
                maxEnd = sentence.end;
              }
            }
          }

          return msToSeconds(maxEnd, true);
        }),
    },
    segments: {
      read: (from) =>
        from("transcript", (transcript) => {
          if (!transcript?.length) return [];

          return transcript.flatMap((speaker) => {
            if (!speaker?.sentences?.length) return [];

            return speaker.sentences.map((sentence) => ({
              start: msToSeconds(sentence.start),
              end: msToSeconds(sentence.end),
              text: sentence.text || "",
              speakerId: speaker.speakerId,
            }));
          });
        }),
    },
    speakers: {
      read: (from) =>
        from("*", ({ transcript, parties }) => {
          const speakers = new Map<
            string,
            {
              id: string;
              origin: SpeakerOrigin;
              user?: { id: string };
              phone?: string;
              name?: string;
              email?: string;
            }
          >();

          // Add speakers from parties data
          if (parties?.length) {
            for (const party of parties) {
              if (!party.speakerId) continue;

              speakers.set(party.speakerId, {
                id: party.speakerId,
                origin:
                  (party.affiliation?.toLowerCase() as SpeakerOrigin) ||
                  "unknown",
                ...(party.userId && {
                  user: {
                    id: party.userId,
                  },
                }),
                ...(party.phoneNumber && {
                  phone: party.phoneNumber,
                }),
                ...(party.name && {
                  name: party.name,
                }),
                ...(party.emailAddress && {
                  email: party.emailAddress,
                }),
              });
            }
          }

          // Add any speakers from transcript that weren't in parties
          if (transcript?.length) {
            for (const speaker of transcript) {
              if (!speaker.speakerId) continue;

              if (!speakers.has(speaker.speakerId)) {
                speakers.set(speaker.speakerId, {
                  id: speaker.speakerId,
                  origin: "unknown",
                });
              }
            }
          }

          return Array.from(speakers.values());
        }),
    },
  },
  createdAt: {
    read: (from) => from("started", (started) => started || new Date()),
  },
  updatedAt: {
    read: (from) => from("started", (started) => started || new Date()),
  },
});
