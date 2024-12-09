import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type PipedriveUser = {
  id: number;
  name: string;
  email: string;
  active_flag: boolean;
  role_id: number;
  created: string;
  modified: string;
};

export default new Mapper<ResourceModels["genericUser"], PipedriveUser>({
  id: {
    read: (from) => from("id", (v) => v.toString()),
  },
  fields: {
    firstName: {
      read: (from) => from("name", (v) => v.split(" ")[0] || ""),
      write: (to) =>
        to("name", (_, d) => `${d.firstName || ""} ${d.lastName || ""}`.trim()),
      key: "name",
      filter: "name",
    },
    lastName: {
      read: (from) =>
        from("name", (v) => v.split(" ").slice(1).join(" ") || ""),
      write: (to) =>
        to("name", (_, d) => `${d.firstName || ""} ${d.lastName || ""}`.trim()),
      key: "name",
      filter: "name",
    },
    email: {
      read: (from) => from("email"),
      write: (to) => to("email"),
      key: "email",
      filter: "email",
    },
  },
  createdAt: {
    read: (from) => from("created", (v) => new Date(v)),
  },
  updatedAt: {
    read: (from) => from("modified", (v) => new Date(v)),
  },
});
