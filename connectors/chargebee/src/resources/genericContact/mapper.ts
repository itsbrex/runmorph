import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type ChargebeeCustomer = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  created_at: number;
  updated_at: number;
  deleted: boolean;
};

export default new Mapper<ResourceModels["genericContact"], ChargebeeCustomer>({
  id: {
    read: (from) => from("id"),
  },
  fields: {
    firstName: {
      read: (from) => from("first_name"),
      write: (to) => to("first_name"),
    },
    lastName: {
      read: (from) => from("last_name"),
      write: (to) => to("last_name"),
    },
    email: {
      read: (from) => from("email"),
      write: (to) => to("email"),
    },
    phone: {
      read: (from) => from("phone"),
      write: (to) => to("phone"),
    },
  },
  createdAt: {
    read: (from) =>
      from("created_at", (timestamp) =>
        timestamp ? new Date(timestamp * 1000) : undefined
      ),
  },
  updatedAt: {
    read: (from) =>
      from("updated_at", (timestamp) =>
        timestamp ? new Date(timestamp * 1000) : undefined
      ),
  },
});
