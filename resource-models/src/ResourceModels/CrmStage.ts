import { ResourceModel } from "..";

const CrmStage = new ResourceModel({
  id: "crmStage",
  schema: (z) => ({
    name: z.string().min(1).max(250).describe("Stage name"),
    type: z
      .enum(["open", "won", "lost", "unknown"])
      .describe("Type of the stage"),
    pipeline: z.morph
      .resource("crmPipeline")
      .optional()
      .describe("Associated pipeline"),
  }),
});

export type CrmStage = typeof CrmStage;
export default CrmStage;
