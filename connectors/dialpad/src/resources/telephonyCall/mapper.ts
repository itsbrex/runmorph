import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type DialpadCall = {
  admin_call_recording_share_links?: string[];
  call_id: string;
  call_recording_share_links?: string[];
  contact?: {
    email?: string;
    id: number;
    name?: string;
    phone?: string;
    type?: string;
  };
  csat_recording_urls?: string[];
  csat_score?: string;
  csat_transcriptions?: string[];
  custom_data?: string;
  date_connected?: number;
  date_ended?: number;
  date_rang?: number;
  date_started?: number;
  direction: "inbound" | "outbound";
  duration?: number;
  entry_point_call_id?: number;
  entry_point_target?: {
    email?: string;
    id: number;
    name?: string;
    phone?: string;
    type?: string;
  };
  event_timestamp?: number;
  external_number?: string;
  group_id?: string;
  internal_number?: string;
  is_transferred?: boolean;
  labels?: string[];
  master_call_id?: number;
  mos_score?: number;
  operator_call_id?: number;
  proxy_target?: {
    email?: string;
    id: number;
    name?: string;
    phone?: string;
    type?: string;
  };
  recording_details?: Array<{
    duration?: number;
    id: string;
    recording_type?: "admincallrecording" | "callrecording" | "voicemail";
    start_time?: number;
    url?: string;
  }>;
  screen_recording_urls?: string[];
  state?:
    | "calling"
    | "ringing"
    | "connected"
    | "merged"
    | "hold"
    | "voicemail"
    | "missed"
    | "voicemail_uploaded"
    | "queued"
    | "eavesdrop"
    | "monitor"
    | "barge"
    | "hangup"
    | "admin"
    | "parked"
    | "takeover"
    | "transcription"
    | "recording"
    | "all"
    | "dispositions"
    | "csat"
    | "pcsat"
    | "recap_summary"
    | "recap_outcome"
    | "recap_purposes"
    | "recap_action_items"
    | "ai_playbook";
  target?: {
    email?: string;
    id: number;
    name?: string;
    phone?: string;
    type?: string;
  };
  total_duration?: number;
  transcription_text?: string;
  voicemail_share_link?: string;
  was_recorded?: boolean;
};

export default new Mapper<ResourceModels["telephonyCall"], DialpadCall>({
  id: {
    read: (from) => from("call_id"),
  },
  fields: {
    direction: {
      read: (from) => from("direction"),
    },
    status: {
      read: (from) =>
        from("state", (state) => {
          switch (state) {
            case "calling":
            case "ringing":
            case "voicemail":
            case "admin":
            case "takeover":
            case "connected":
            case "merged":
            case "hold":
            case "parked":
            case "monitor":
            case "barge":
            case "eavesdrop":
            case "queued":
              return "inProgress";
            case "hangup":
            case "voicemail_uploaded":
            case "recording":
            case "transcription":
            case "recap_summary":
            case "recap_outcome":
            case "recap_purposes":
            case "recap_action_items":
            case "ai_playbook":
              return "completed";
            case "missed":
              return "missed";
            default:
              return "inProgress";
          }
        }),
    },
    startedAt: {
      read: (from) =>
        from("date_started", (date) =>
          date ? new Date(Number(date)).toISOString() : undefined
        ),
    },
    endedAt: {
      read: (from) =>
        from("date_ended", (date) =>
          date ? new Date(Number(date)).toISOString() : undefined
        ),
    },
    answeredAt: {
      read: (from) =>
        from("date_connected", (date) =>
          date ? new Date(Number(date)).toISOString() : undefined
        ),
    },
    duration: {
      read: (from) =>
        from("duration", (duration) =>
          duration ? Math.floor(duration / 1000) : 0
        ),
    },
    recordingUrl: {
      read: (from) =>
        from("recording_details", (details) => {
          if (!details || details.length === 0) return undefined;

          const callRecording = details.find(
            (d) => d.recording_type === "callrecording"
          );
          if (callRecording?.url) return callRecording.url;

          const voicemail = details.find(
            (d) => d.recording_type === "voicemail"
          );
          if (voicemail?.url) return voicemail.url;

          const adminRecording = details.find(
            (d) => d.recording_type === "admincallrecording"
          );
          if (adminRecording?.url) return adminRecording.url;

          return details[0]?.url ?? undefined;
        }),
    },
    users: {
      read: (from) =>
        from("target", (target) => {
          if (!target || target.type !== "user") return [];
          return [{ id: target.id.toString() }];
        }),
    },
    contacts: {
      read: (from) =>
        from("contact", (contact) => {
          if (!contact) return [];
          return [{ id: contact.id.toString() }];
        }),
    },
    externalNumber: {
      read: (from) => from("*", (raw) => raw.external_number),
    },
    internalNumber: {
      read: (from) => from("*", (raw) => raw.internal_number),
    },
    transcript: {
      read: (from) =>
        from("*", (call) => {
          if (!call.call_id) return undefined;

          if (!call.recording_details || call.recording_details.length === 0)
            return undefined;

          let hasCallRecording = false;
          const callRecording = call.recording_details.find(
            (d) => d.recording_type === "callrecording"
          );
          hasCallRecording = !!callRecording?.url;

          const voicemail = call.recording_details.find(
            (d) => d.recording_type === "voicemail"
          );
          hasCallRecording = !!voicemail?.url;

          const adminRecording = call.recording_details.find(
            (d) => d.recording_type === "admincallrecording"
          );
          hasCallRecording = !!adminRecording?.url;

          if (!hasCallRecording) return undefined;

          return {
            id: call.call_id.toString(),
          };
        }),
    },
  },
  createdAt: {
    read: (from) =>
      from("date_started", (date) =>
        date ? new Date(Number(date)) : new Date()
      ),
  },
  updatedAt: {
    read: (from) =>
      from("*", (call) => {
        const dates = [
          call.date_started,
          call.date_rang,
          call.date_connected,
          call.date_ended,
        ].filter((date): date is number => typeof date === "number");

        return dates.length > 0 ? new Date(Math.max(...dates)) : new Date();
      }),
  },
});
