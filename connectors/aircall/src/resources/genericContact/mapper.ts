import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type AircallContact = {
  id: number;
  direct_link: string;
  first_name: string;
  last_name: string;
  company_name: string | null;
  information: string | null;
  is_shared: boolean;
  created_at: number;
  updated_at: number;
  emails: string[];
  phone_numbers: {
    id: number;
    label: string;
    value: string;
  }[];
};

export default new Mapper<ResourceModels["genericContact"], AircallContact>({
  id: {
    read: (from) => from("id", (id) => id.toString()),
  },
  fields: {
    firstName: {
      read: (from) => from("first_name"),
    },
    lastName: {
      read: (from) => from("last_name"),
    },
    email: {
      read: (from) => from("emails", (emails) => emails?.[0]),
    },
    phone: {
      read: (from) =>
        from("phone_numbers", (numbers) =>
          numbers?.[0]?.value?.replace(/\s/g, "")
        ),
    },
  },
  createdAt: {
    read: (from) =>
      from("created_at", (created_at) =>
        created_at ? new Date(created_at * 1000) : undefined
      ),
  },
  updatedAt: {
    read: (from) =>
      from("updated_at", (updated_at) =>
        updated_at ? new Date(updated_at * 1000) : undefined
      ),
  },
});
