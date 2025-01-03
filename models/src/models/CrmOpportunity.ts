import { Model } from "..";

const CrmOpportunity = new Model({
  id: "crmOpportunity",
  schema: (z) => ({
    name: z.string().min(1).max(250).optional().describe("Opportunity name"),
    amount: z.number().min(0).optional().describe("Opportunity amount"),
    currency: z.string().min(3).max(3).optional().describe("Currency code"),
    stage: z.morph
      .resource("crmStage")
      .optional()
      .describe("Stage of the opportunity"),
    pipeline: z.morph
      .resource("crmPipeline")
      .optional()
      .describe("Pipeline of the opportunity"),
    owner: z.morph
      .resource("genericUser")
      .optional()
      .describe("User that own the opportunity"),
    contacts: z
      .array(z.morph.resource("genericContact").optional())
      .optional()
      .describe("Associated contacts"),
    companies: z
      .array(z.morph.resource("genericCompany").optional())
      .optional()
      .describe("Associated companies"),
  }),
});

export type CrmOpportunity = typeof CrmOpportunity;
export default CrmOpportunity;
