import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type PipedriveContact = {
  id: number;
  name: string; // for create and update
  first_name: string;
  last_name: string;
  email: Array<{ value: string; primary?: boolean }>;
  phone: Array<{ value: string; primary?: boolean }>;
  add_time: string;
  update_time: string;
};

export default new Mapper<ResourceModels["genericContact"], PipedriveContact>({
  id: {
    read: (from) => from("id", (v) => v.toString()),
  },
  fields: {
    firstName: {
      read: (from) => from("first_name"),
      write: (to) =>
        to("name", (_, contact) =>
          ((contact.firstName || "") + " " + (contact.lastName || "")).trim()
        ),
      key: "first_name",
      filter: "first_name",
    },
    lastName: {
      read: (from) => from("last_name"),
      write: (to) =>
        to("name", (_, contact) =>
          ((contact.firstName || "") + " " + (contact.lastName || "")).trim()
        ),
      key: "last_name",
      filter: "last_name",
    },
    email: {
      read: (from) =>
        from("email", (v) => {
          const primaryEmail = v.find((e) => e.primary)?.value;
          return primaryEmail || v[0]?.value || "";
        }),
      write: (to) =>
        to("email", (v) => (v ? [{ value: v, primary: true }] : [])),
      key: "email",
      filter: "email",
    },
    phone: {
      read: (from) =>
        from("phone", (v) => {
          const primaryPhone = v.find((p) => p.primary)?.value;
          return primaryPhone || v[0]?.value || "";
        }),
      write: (to) =>
        to("phone", (v) => (v ? [{ value: v, primary: true }] : [])),
      key: "phone",
      filter: "phone",
    },
  },
  createdAt: {
    read: (from) => from("add_time", (v) => new Date(v)),
  },
  updatedAt: {
    read: (from) => from("update_time", (v) => new Date(v)),
  },
});
