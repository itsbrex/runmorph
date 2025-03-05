import { ResourceModel } from "..";

const CrmEngagement = new ResourceModel({
  id: "crmEngagement",
  schema: (z) => ({
    type: z
      .enum(["call", "meeting", "email", "task", "note"])
      .describe("Type of engagement"),
    direction: z
      .enum(["inbound", "outbound"])
      .optional()
      .describe("Direction of the engagement"),
    status: z
      .enum(["planned", "inProgress", "completed", "canceled"])
      .optional()
      .describe("Engagement status"),
    title: z.string().optional().describe("Subject or title of the engagement"),
    description: z.string().optional().describe("Engagement content details"),
    startedAt: z.string().datetime().describe("Start time in ISO 8601 format"),
    endedAt: z
      .string()
      .datetime()
      .optional()
      .describe("End time in ISO 8601 format"),
    duration: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe("Duration in seconds"),
    owner: z.morph
      .resource("genericUser")
      .optional()
      .describe("Owner of the engagement"),
    users: z
      .array(z.morph.resource("genericUser"))
      .optional()
      .describe("Related users"),
    companies: z
      .array(z.morph.resource("genericCompany"))
      .optional()
      .describe("Related companies"),
    contacts: z
      .array(z.morph.resource("genericContact"))
      .optional()
      .describe("Related contacts"),
    opportunities: z
      .array(z.morph.resource("crmOpportunity"))
      .optional()
      .describe("Related opportunities"),
  }),
});

export type CrmEngagement = typeof CrmEngagement;
export default CrmEngagement;
