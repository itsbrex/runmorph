import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type PipedriveCompany = {
  data: {
    id: number;
    name: string;
    address: string;
    add_time: string;
    update_time: string;
  };
};

export default new Mapper<ResourceModels["genericCompany"], PipedriveCompany>({
  id: {
    read: (from) => from("data.id", (v) => v.toString()),
  },
  fields: {
    name: {
      read: (from) => from("data.name"),
      write: (to) => to("data.name"),
      key: "name",
      filter: "name",
    },
  },
  createdAt: {
    read: (from) => from("data.add_time", (v) => new Date(v)),
  },
  updatedAt: {
    read: (from) => from("data.update_time", (v) => new Date(v)),
  },
});
