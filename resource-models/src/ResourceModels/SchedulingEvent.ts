import { ResourceModel } from "..";

const SchedulingEvent = new ResourceModel({
  id: "schedulingEvent",
  schema: (z) => ({
    eventType: z.morph
      .resource("schedulingEventType")
      .describe("The scheduling event type this event belongs to")
      .optional(),
    title: z.string().optional().describe("Title of the scheduling event"),
    description: z
      .string()
      .optional()
      .describe("Description of the scheduling event"),
    status: z
      .enum(["requested", "planned", "inProgress", "completed", "canceled"])
      .optional()
      .describe("Status of the scheduling event"),
    startTime: z.string().datetime().describe("Start time of the event"),
    endTime: z.string().datetime().optional().describe("End time of the event"),
    duration: z
      .number()
      .optional()
      .describe("Duration of the event in minutes"),
    attendees: z
      .array(z.morph.resource("genericUser"))
      .optional()
      .describe("Internal attendees of the event"),
    externalAttendees: z
      .array(
        z.object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          email: z.string(),
          phoneNumber: z.string().optional(),
        })
      )
      .describe("External attendees of the event"),
    organizer: z.morph
      .resource("genericUser")
      .optional()
      .describe("Organizer of the event"),
    answers: z
      .record(z.union([z.string(), z.array(z.string()), z.number()]))
      .describe("Answers to the event type questions"),
  }),
});

export type SchedulingEvent = typeof SchedulingEvent;
export default SchedulingEvent;
