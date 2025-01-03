import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type HubSpotCompany = {
  id: string;
  properties: {
    name: string;
    website: string;
  };
  createdAt: string;
  updatedAt: string;
};

export default new Mapper<ResourceModels["genericCompany"], HubSpotCompany>({
  id: {
    read: (from) => from("id"),
  },
  fields: {
    name: {
      read: (from) => from("properties.name"),
      write: (to) => to("properties.name"),
      key: "name",
    },
  },
  createdAt: {
    read: (from) => from("createdAt", (v) => new Date(v)),
  },
  updatedAt: {
    read: (from) => from("updatedAt", (v) => new Date(v)),
  },
});
