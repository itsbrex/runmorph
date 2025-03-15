import { ResourceModel } from "..";

const SchedulingSlot = new ResourceModel({
  id: "schedulingSlot",
  schema: (z) => ({
    eventType: z.morph
      .resource("schedulingEventType")
      .describe("The scheduling event type this slot belongs to")
      .optional(),
    timezone: z.string().optional().describe("Timezone of the scheduling slot"),
    status: z
      .enum(["available", "unavailable"])
      .describe("Availability status of the slot"),
    date: z.string().describe("Date of the scheduling slot"),
    startTime: z.string().describe("Start time of the scheduling slot"),
  }),
});

export type SchedulingSlot = typeof SchedulingSlot;
export default SchedulingSlot;
