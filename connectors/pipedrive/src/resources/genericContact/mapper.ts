import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type PipedriveContact = {
  data: {
    id: number;
    first_name: string;
    last_name: string;
    email: Array<{ value: string; primary?: boolean }>;
    phone: Array<{ value: string; primary?: boolean }>;
    add_time: string;
    update_time: string;
  };
};

export default new Mapper<ResourceModels["genericContact"], PipedriveContact>({
  id: {
    read: (from) => from("data.id", (v) => v.toString()),
  },
  fields: {
    firstName: {
      read: (from) => from("data.first_name"),
      write: (to) => to("data.first_name"),
      key: "first_name",
      filter: "first_name",
    },
    lastName: {
      read: (from) => from("data.last_name"),
      write: (to) => to("data.last_name"),
      key: "last_name",
      filter: "last_name",
    },
    email: {
      read: (from) =>
        from("data.email", (v) => {
          const primaryEmail = v.find((e) => e.primary)?.value;
          return primaryEmail || v[0]?.value || "";
        }),
      write: (to) =>
        to("data.email", (v) => (v ? [{ value: v, primary: true }] : [])),
      key: "email",
      filter: "email",
    },
    phone: {
      read: (from) =>
        from("data.phone", (v) => {
          const primaryPhone = v.find((p) => p.primary)?.value;
          return primaryPhone || v[0]?.value || "";
        }),
      write: (to) =>
        to("data.phone", (v) => (v ? [{ value: v, primary: true }] : [])),
      key: "phone",
      filter: "phone",
    },
  },
  createdAt: {
    read: (from) => from("data.add_time", (v) => new Date(v)),
  },
  updatedAt: {
    read: (from) => from("data.update_time", (v) => new Date(v)),
  },
});
