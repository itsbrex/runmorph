import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type PipedriveCompany = {
  id: number;
  name: string;
  address: string;
  add_time: string;
  update_time: string;
};

export default new Mapper<ResourceModels["genericCompany"], PipedriveCompany>({
  id: {
    read: (from) => from("id", (v) => v.toString()),
  },
  fields: {
    name: {
      read: (from) => from("name"),
      write: (to) => to("name"),
      key: "name",
      filter: "name",
    },
  },
  createdAt: {
    read: (from) => from("add_time", (v) => new Date(v)),
  },
  updatedAt: {
    read: (from) => from("update_time", (v) => new Date(v)),
  },
});
