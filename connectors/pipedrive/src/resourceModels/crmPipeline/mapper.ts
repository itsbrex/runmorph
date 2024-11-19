import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

import type { PipedriveStage } from "../crmStage/mapper";
export type PipedrivePipeline = {
  id: number;
  name: string;
  order_nr: number;
  active: boolean;
  deal_probability: boolean;
  add_time: string;
  update_time: string;
  selected: boolean;
  // Add stages
  _stages: PipedriveStage[];
};

export default new Mapper<ResourceModels["crmPipeline"], PipedrivePipeline>({
  id: {
    read: (from) => from("id", (v) => v.toString()),
  },
  fields: {
    name: {
      read: (from) => from("name"),
      write: (to) => to("name"),
    },
    stages: {
      read: (from) =>
        from("_stages", (stages) =>
          stages.map((stage) => ({
            id: stage.id.toString(),
            rawResource: stage,
          })),
        ),
      key: "_stages",
    },
  },
  createdAt: {
    read: (from) => from("add_time", (v) => new Date(v)),
  },
  updatedAt: {
    read: (from) => from("update_time", (v) => new Date(v)),
  },
});
