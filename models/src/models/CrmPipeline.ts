import { Model } from "..";

const CrmPipeline = new Model({
  id: "crmPipeline",
  schema: (z) => ({
    name: z.string().min(1).max(250).describe("Pipeline name"),
    stages: z
      .array(z.morph.resource("crmStage"))
      .describe("Stages in the pipeline"),
  }),
});

export type CrmPipeline = typeof CrmPipeline;
export default CrmPipeline;
