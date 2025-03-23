import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type SalesforceStage = {
  Id: string;
  MasterLabel: string;
  ForecastCategoryName: string;
  IsActive: boolean;
  DefaultProbability: number;
  CreatedDate: string;
  LastModifiedDate: string;
};

export type SalesforceQueryStageResponse = {
  records: SalesforceStage[];
  done: boolean;
  totalSize: number;
};

export default new Mapper<ResourceModels["crmStage"], SalesforceStage>({
  id: {
    read: (from) => from("Id", (id) => id.substring(0, 15)),
    key: "Id",
  },
  fields: {
    name: {
      read: (from) => from("MasterLabel"),
      write: (to) => to("MasterLabel"),
      key: "MasterLabel",
    },
    type: {
      read: (from) =>
        from("*", (sfStage) => {
          let type: "open" | "won" | "lost" | "unknown" = "unknown";
          if (
            sfStage.ForecastCategoryName === "Closed" ||
            sfStage.ForecastCategoryName === "Omitted"
          ) {
            type = sfStage.DefaultProbability === 100 ? "won" : "lost";
          } else if (sfStage.ForecastCategoryName === "Pipeline") {
            type = "open";
          }
          return type;
        }),
      keys: ["ForecastCategoryName", "DefaultProbability"],
    },
    pipeline: {
      read: (from) =>
        from("Id", () => ({
          id: "Opportunity",
        })),
    },
  },
  createdAt: {
    read: (from) => from("CreatedDate", (v) => new Date(v)),
    key: "CreatedDate",
  },
  updatedAt: {
    read: (from) => from("LastModifiedDate", (v) => new Date(v)),
    key: "LastModifiedDate",
  },
});
