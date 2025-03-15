import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type CalendlySlot = {
  event_type_id: string;
  availability_timezone: string;
  date: string;
  status: "available" | "unavailable";
  start_time: string;
  invitees_remaining: number;
  created_at: string;
  updated_at: string;
};

export default new Mapper<ResourceModels["schedulingSlot"], CalendlySlot>({
  id: {
    read: (from) =>
      from(
        "*",
        (slot) =>
          "res_" +
          Buffer.from(
            JSON.stringify({
              eventType: slot.event_type_id,
              startAt: slot.start_time,
            })
          ).toString("base64")
      ),
  },
  fields: {
    eventType: {
      read: (from) =>
        from("event_type_id", (id) => ({
          id,
        })),
    },
    timezone: {
      read: (from) => from("availability_timezone"),
    },
    status: {
      read: (from) => from("status"),
    },
    date: {
      read: (from) => from("date"),
    },
    startTime: {
      read: (from) => from("start_time"),
    },
  },
  createdAt: {
    read: (from) =>
      from("created_at", (date) => (date ? new Date(date) : new Date())),
  },
  updatedAt: {
    read: (from) =>
      from("updated_at", (date) => (date ? new Date(date) : new Date())),
  },
});
