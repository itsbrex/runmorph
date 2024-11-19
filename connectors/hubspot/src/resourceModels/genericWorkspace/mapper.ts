import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type HubSpotAccountInfo = {
  portalId: number;
};

export default new Mapper<
  ResourceModels["genericWorkspace"],
  HubSpotAccountInfo
>({
  id: {
    read: (from) => from("portalId", (v) => v.toString()),
  },
  fields: {
    name: {
      read: (from) => from("portalId", (v) => `HubSpot (${v})`),
    },
  },
  createdAt: {
    read: (from) => from("*", () => new Date()),
  },
  updatedAt: {
    read: (from) => from("*", () => new Date()),
  },
});
