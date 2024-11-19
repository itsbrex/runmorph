import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

import { HubSpotStage } from "../crmStage/mapper";

export type HubSpotPipeline = {
  id: string;
  label: string;
  displayOrder: number;
  stages: Array<HubSpotStage>;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
};

export default new Mapper<ResourceModels["crmPipeline"], HubSpotPipeline>({
  id: {
    read: (from) => from("id"),
  },
  fields: {
    name: {
      read: (from) => from("label"),
      write: (to) => to("label"),
      key: "label",
    },
    stages: {
      read: (from) =>
        from("stages", (stages, d) =>
          stages.map((stage) => {
            stage._pipelineId = d.id;
            return {
              id: `${d.id}::${stage.id}`,
              rawResource: stage,
            };
          }),
        ),
      key: "stages",
    },
  },
  createdAt: {
    read: (from) => from("createdAt", (v) => new Date(v)),
  },
  updatedAt: {
    read: (from) => from("updatedAt", (v) => new Date(v)),
  },
});
