import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type AircallCall = {
  id: number;
  direction: "inbound" | "outbound";
  status: "done" | "initial" | "answered" | "missed" | "voicemail";
  started_at?: number;
  answered_at?: number;
  ended_at?: number;
  duration?: number;
  voicemail?: string;
  recording?: string;
  raw_digits?: string;
  user?: {
    id: number;
    name: string;
  };
  contact?: {
    id: number;
    first_name: string;
    last_name: string;
    phone_numbers: Array<{
      id: number;
      label: string;
      value: string;
    }>;
  } | null;
  number: {
    id: number;
    digits: string;
  };
};

export default new Mapper<ResourceModels["telephonyCall"], AircallCall>({
  id: {
    read: (from) => from("id", (id) => id.toString()),
  },
  fields: {
    direction: {
      read: (from) => from("direction"),
    },
    status: {
      read: (from) =>
        from("status", (status) => {
          switch (status) {
            case "initial":
              return "inProgress";
            case "answered":
              return "inProgress";
            case "missed":
              return "missed";
            case "voicemail":
              return "voicemail";
            case "done":
              return "completed";
            default:
              return "inProgress";
          }
        }),
    },
    startedAt: {
      read: (from) =>
        from("started_at", (started_at) =>
          started_at ? new Date(started_at * 1000).toISOString() : undefined
        ),
    },
    endedAt: {
      read: (from) =>
        from("ended_at", (ended_at) =>
          ended_at ? new Date(ended_at * 1000).toISOString() : undefined
        ),
    },
    answeredAt: {
      read: (from) =>
        from("answered_at", (answered_at) =>
          answered_at ? new Date(answered_at * 1000).toISOString() : undefined
        ),
    },
    duration: {
      read: (from) =>
        from("duration", (duration) =>
          duration && duration > 0 ? duration : 0
        ),
    },
    recordingUrl: {
      read: (from) =>
        from("*", (call) =>
          call.recording
            ? call.recording
            : call.voicemail
              ? call.voicemail
              : undefined
        ),
    },
    users: {
      read: (from) =>
        from("user", (user) => {
          if (!user) return [];
          return [{ rawResource: user, id: user.id.toString() }];
        }),
    },
    contacts: {
      read: (from) =>
        from("contact", (contact) => {
          if (!contact) return [];
          return [
            {
              rawResource: contact,
              id: contact.id.toString(),
            },
          ];
        }),
      key: "fetch_contact",
    },
    externalNumber: {
      read: (from) =>
        from(
          "raw_digits",
          (raw_digits) =>
            raw_digits &&
            (raw_digits === "anonymous"
              ? undefined
              : raw_digits.replace(/\s/g, ""))
        ),
    },
    internalNumber: {
      read: (from) =>
        from("number.digits", (digits) => digits && digits?.replace(/\s/g, "")),
    },
    transcript: {
      read: (from) =>
        from("*", (call) => {
          if (!call.id || (!call.recording && !call.voicemail)) {
            return undefined;
          }
          return {
            id: call.id.toString(),
          };
        }),
    },
  },
  createdAt: {
    read: (from) =>
      from("started_at", (started_at) => {
        const createdAt = started_at || Math.floor(Date.now() / 1000);
        return new Date(createdAt * 1000);
      }),
  },
  updatedAt: {
    read: (from) =>
      from("*", (rawCall) => {
        const updatedAt =
          rawCall.ended_at ||
          rawCall.answered_at ||
          rawCall.started_at ||
          Math.floor(Date.now() / 1000);
        return new Date(updatedAt * 1000);
      }),
  },
});
