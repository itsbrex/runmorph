import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type PipedriveUser = {
  data: {
    id: number;
    name: string;
    email: string;
    active_flag: boolean;
    role_id: number;
    created: string;
    modified: string;
  };
};

export default new Mapper<ResourceModels["genericUser"], PipedriveUser>({
  id: {
    read: (from) => from("data.id", (v) => v.toString()),
  },
  fields: {
    firstName: {
      read: (from) => from("data.name", (v) => v.split(" ")[0] || ""),
      write: (to) =>
        to("data.name", (_, d) =>
          `${d.firstName || ""} ${d.lastName || ""}`.trim(),
        ),
      key: "name",
      filter: "name",
    },
    lastName: {
      read: (from) =>
        from("data.name", (v) => v.split(" ").slice(1).join(" ") || ""),
      write: (to) =>
        to("data.name", (_, d) =>
          `${d.firstName || ""} ${d.lastName || ""}`.trim(),
        ),
      key: "name",
      filter: "name",
    },
    email: {
      read: (from) => from("data.email"),
      write: (to) => to("data.email"),
      key: "email",
      filter: "email",
    },
  },
  createdAt: {
    read: (from) => from("data.created", (v) => new Date(v)),
  },
  updatedAt: {
    read: (from) => from("data.modified", (v) => new Date(v)),
  },
});
