import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type GongCall = {
  metaData: {
    id: string;
    url: string;
    title: string;
    scheduled: string;
    started: string;
    duration: number;
    primaryUserId: string;
    direction: "Conference" | "Inbound" | "Outbound" | "Unknown";
    system: string;
    scope: string;
    media: string;
    language: string;
    workspaceId: string;
    sdrDisposition?: string | null;
    clientUniqueId?: string | null;
    customData?: string | null;
    purpose?: string | null;
    meetingUrl?: string;
    isPrivate: boolean;
    calendarEventId?: string | null;
  };
  parties: Array<{
    id: string;
    emailAddress: string;
    name: string;
    userId: string;
    speakerId: string;
    affiliation: "Internal" | "External" | "Unknown";
    phoneNumber: string;
    methods: string[];
  }>;
  interaction: {
    speakers: Array<{
      id: string;
      userId: string;
      talkTime: number;
    }>;
  };
  media: {
    audioUrl: string;
  };
};

export default new Mapper<ResourceModels["telephonyCall"], GongCall>({
  id: {
    read: (from) => from("metaData.id"),
  },
  fields: {
    direction: {
      read: (from) =>
        from("metaData.direction", (direction) =>
          direction.toLowerCase() === "inbound" ? "inbound" : "outbound"
        ),
    },
    status: {
      read: (from) =>
        from("metaData", (metaData) => {
          const now = new Date();
          const scheduledDate = new Date(metaData.scheduled);

          if (scheduledDate < now && !metaData.started) {
            return "missed";
          }

          if (!metaData.started) {
            return "planned";
          }

          return "completed";
        }),
    },
    startedAt: {
      read: (from) =>
        from("metaData.started", (started) =>
          started ? new Date(started).toISOString() : undefined
        ),
    },
    endedAt: {
      read: (from) =>
        from("*", (raw) => {
          if (!raw.metaData.started || !raw.metaData.duration) return undefined;
          const startDate = new Date(raw.metaData.started);
          const endDate = new Date(
            startDate.getTime() + raw.metaData.duration * 1000
          );
          return endDate.toISOString();
        }),
    },
    duration: {
      read: (from) =>
        from("metaData.duration", (duration) =>
          duration && duration > 0 ? duration : 0
        ),
    },
    users: {
      read: (from) =>
        from("parties", (parties) => {
          if (!parties) return [];
          return parties
            .filter((party) => party.affiliation === "Internal")
            .map((party) => ({ id: party.userId }));
        }),
    },
    externalNumber: {
      read: (from) =>
        from("parties", (parties) => {
          const externalParty = parties?.find(
            (p) => p.affiliation === "External"
          );
          return externalParty?.phoneNumber || undefined;
        }),
    },
    internalNumber: {
      read: (from) =>
        from("parties", (parties) => {
          const internalParty = parties?.find(
            (p) => p.affiliation === "Internal"
          );
          return internalParty?.phoneNumber || undefined;
        }),
    },
    recordingUrl: {
      read: (from) =>
        from("media.audioUrl", (recordingUrl) => recordingUrl || undefined),
    },
  },
  createdAt: {
    read: (from) =>
      from("metaData.started", (started) => {
        const createdAt = started ? new Date(started) : new Date();
        return createdAt;
      }),
  },
  updatedAt: {
    read: (from) =>
      from("*", (raw) => {
        if (!raw.metaData.started || !raw.metaData.duration) {
          return new Date();
        }
        const startDate = new Date(raw.metaData.started);
        return new Date(startDate.getTime() + raw.metaData.duration * 1000);
      }),
  },
});
