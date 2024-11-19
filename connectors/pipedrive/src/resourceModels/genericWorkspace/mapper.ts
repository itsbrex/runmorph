import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type PipedriveWorkspace = {
  data: {
    company_id: number;
    company_name: string;
    company_domain: string;
    company_country: string;
    created: string;
    modified: string;
  };
};

export default new Mapper<
  ResourceModels["genericWorkspace"],
  PipedriveWorkspace
>({
  id: {
    read: (from) => from("data.company_id", (v) => v.toString()),
  },
  fields: {
    name: {
      read: (from) => from("data.company_name"),
    },
  },
  createdAt: {
    read: (from) => from("data.created", (v) => new Date(v)),
  },
  updatedAt: {
    read: (from) => from("data.modified", (v) => new Date(v)),
  },
});
