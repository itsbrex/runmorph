import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";
import { CalendlyEventType } from "../schedulingEventType/mapper";

export type CalendlyEvent = {
  id: string;
  eventTypeId: string;
  eventType: CalendlyEventType;
  name: string;
  description: string;
  duration?: number;
  status: "requested" | "planned" | "inProgress" | "completed" | "canceled";
  startTime: string;
  endTime: string;
  attendees: Array<{
    id: string;
  }>;
  externalAttendees: Array<{
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }>;
  answers: Record<string, string | string[] | number>;
  createdAt: string;
  updatedAt: string;
};

export default new Mapper<ResourceModels["schedulingEvent"], CalendlyEvent>({
  id: {
    read: (from) => from("id"),
  },
  fields: {
    eventType: {
      read: (from) =>
        from("eventTypeId", (eventTypeId) => ({
          id: eventTypeId,
        })),
      write: (to) => to("eventTypeId", (eventType) => eventType.id),
    },
    status: {
      read: (from) => from("status"),
    },
    startTime: {
      read: (from) => from("startTime"),
      write: (to) => to("startTime"),
    },
    endTime: {
      read: (from) => from("endTime"),
    },
    duration: {
      read: (from) => from("duration", (d) => (d ? d : undefined)),
      write: (to) => to("duration", (d) => (d ? d : undefined)),
    },
    attendees: {
      read: (from) => from("attendees"),
    },
    externalAttendees: {
      read: (from) => from("externalAttendees"),
      write: (to) => to("externalAttendees"),
    },
    answers: {
      read: (from) => from("answers"),
      write: (to) => to("answers"),
    },
  },
  createdAt: {
    read: (from) => from("createdAt", (date) => new Date(date)),
  },
  updatedAt: {
    read: (from) => from("updatedAt", (date) => new Date(date)),
  },
});
