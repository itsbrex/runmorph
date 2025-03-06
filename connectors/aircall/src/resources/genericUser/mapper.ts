import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type AircallUser = {
  id: number;
  name: string;
  email: string;
  available: boolean;
  availability_status: string;
  created_at: string;
  time_zone: string;
  language: string;
  substatus: string;
  wrap_up_time: number;
  default_number_id: number;
  numbers: {
    id: number;
    name: string;
    digits: string;
    country: string;
    time_zone: string;
    open: boolean;
    availability_status: string;
    is_ivr: boolean;
    live_recording_activated: boolean;
    priority: any;
    messages: {
      welcome: string;
      waiting: string;
      ivr: string;
      voicemail: string;
      closed: string;
      callback_later: string;
      unanswered_call: string;
      after_hours: string;
      ringing_tone: string;
    };
  }[];
};

export default new Mapper<ResourceModels["genericUser"], AircallUser>({
  id: {
    read: (from) => from("id", (id) => id.toString()),
  },
  fields: {
    firstName: {
      read: (from) => from("name", (name) => name?.split(" ")[0]),
    },
    lastName: {
      read: (from) =>
        from("name", (name) => {
          const parts = name?.split(" ");
          return parts?.length > 1 ? parts.slice(1).join(" ") : undefined;
        }),
    },
    email: {
      read: (from) => from("email"),
    },
  },
  createdAt: {
    read: (from) =>
      from("created_at", (created_at) =>
        created_at ? new Date(created_at) : undefined
      ),
  },
  updatedAt: {
    read: (from) =>
      from("created_at", (created_at) =>
        created_at ? new Date(created_at) : undefined
      ),
  },
});
