import { Model } from "..";

const CrmStage = new Model({
  id: "crmStage",
  schema: (z) => ({
    name: z.string().min(1).max(250).describe("Stage name"),
    type: z.enum(["OPEN", "WON", "LOST", "UNKNOWN"]).describe("Stage type"),
    pipeline: z.morph
      .resource("crmPipeline")
      .optional()
      .describe("Associated pipeline"),
  }),
});

export type CrmStage = typeof CrmStage;
export default CrmStage;
