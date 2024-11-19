import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type HubSpotStage = {
  id: string;
  label: string;
  displayOrder: number;
  metadata: {
    isClosed: string;
    probability: string;
  };
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  writePermissions: string;
  // Added a fake pipelineId
  _pipelineId: string;
};

export default new Mapper<ResourceModels["crmStage"], HubSpotStage>({
  // Update id config to accept write or add a "composed" id
  id: {
    read: (from) => from("*", (_, d) => `${d._pipelineId}::${d.id}`),
  },
  fields: {
    name: {
      read: (from) => from("label"),
    },
    type: {
      read: (from) =>
        from("*", (_, d) => {
          if (d.archived) return "UNKNOWN";
          if (d.metadata.isClosed === "true") {
            return d.metadata.probability === "1.0" ? "WON" : "LOST";
          } else {
            return "OPEN";
          }
        }),
    },
    pipeline: {
      read: (from) =>
        from("_pipelineId", (v) => ({
          id: v,
        })),
    },
  },
  createdAt: {
    read: (from) => from("createdAt", (v) => new Date(v)),
  },
  updatedAt: {
    read: (from) => from("updatedAt", (v) => new Date(v)),
  },
});
