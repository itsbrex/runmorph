import { ResourceModel } from "..";

const SchedulingEventType = new ResourceModel({
  id: "schedulingEventType",
  schema: (z) => ({
    name: z.string().describe("Name of the scheduling event type"),
    status: z
      .enum(["active", "inactive"])
      .describe("Status of the scheduling event type"),
    durations: z
      .array(z.number().int().min(0))
      .optional()
      .describe("Available durations in minutes"),
    questions: z
      .array(
        z.discriminatedUnion("type", [
          z.object({
            key: z.string(),
            type: z.literal("text"),
            name: z.string(),
            required: z.boolean(),
            description: z.string().optional(),
            default: z.string().optional(),
          }),
          z.object({
            key: z.string(),
            type: z.literal("number"),
            name: z.string(),
            required: z.boolean(),
            description: z.string().optional(),
            default: z.string().optional(),
          }),
          z.object({
            key: z.string(),
            type: z.literal("select"),
            name: z.string(),
            required: z.boolean(),
            description: z.string().optional(),
            options: z.array(
              z.object({
                value: z.string(),
                name: z.string(),
              })
            ),
            default: z.string().optional(),
          }),
          z.object({
            key: z.string(),
            type: z.literal("multiselect"),
            name: z.string(),
            required: z.boolean(),
            description: z.string().optional(),
            options: z.array(
              z.object({
                value: z.string(),
                name: z.string(),
              })
            ),
            default: z.string().optional(),
          }),
        ])
      )
      .describe("Questions to ask when scheduling"),
    schedulingUrl: z.string().describe("URL to schedule this event type"),
    slots: z
      .array(z.morph.resource("schedulingSlot").optional())
      .optional()
      .describe("Available slots for this event type"),
    owner: z.morph
      .resource("genericUser")
      .optional()
      .describe("Owner of this scheduling event type"),
  }),
});

export type SchedulingEventType = typeof SchedulingEventType;
export default SchedulingEventType;
