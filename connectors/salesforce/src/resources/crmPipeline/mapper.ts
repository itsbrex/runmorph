import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

import { SalesforceStage } from "../crmStage/mapper";

export type SalesforceOpportunityPipeline = {
  Id: string;
  stages: SalesforceStage[];
};

export default new Mapper<
  ResourceModels["crmPipeline"],
  SalesforceOpportunityPipeline
>({
  id: {
    read: (from) => from("Id", (id) => id.substring(0, 15)),
  },
  fields: {
    name: {
      read: (from) => from("Id"),
      write: (to) => to("Id"),
    },
    stages: {
      read: (from) =>
        from("stages", (stages) =>
          stages.map((stage) => ({ id: stage.Id.substring(0, 15) }))
        ),
    },
  },
  createdAt: {
    read: (from) =>
      from(
        "stages",
        (stages) =>
          new Date(
            Math.min(
              ...stages.map((stage) => new Date(stage.CreatedDate).getTime())
            )
          )
      ),
  },
  updatedAt: {
    read: (from) =>
      from(
        "stages",
        (stages) =>
          new Date(
            Math.max(
              ...stages.map((stage) =>
                new Date(stage.LastModifiedDate).getTime()
              )
            )
          )
      ),
  },
});
