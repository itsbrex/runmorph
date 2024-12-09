import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type HubSpotUser = {
  id: string;
  email: string;
  type: string;
  firstName: string;
  lastName: string;
  userId: number;
  userIdIncludingInactive: number;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
};

export default new Mapper<ResourceModels["genericUser"], HubSpotUser>({
  id: {
    read: (from) => from("id"),
  },
  fields: {
    firstName: {
      read: (from) => from("firstName"),
      write: (to) => to("firstName"),
    },
    lastName: {
      read: (from) => from("lastName"),
      write: (to) => to("lastName"),
    },
    email: {
      read: (from) => from("email"),
      write: (to) => to("email"),
    },
  },
  createdAt: {
    read: (from) => from("createdAt", (v) => new Date(v)),
  },
  updatedAt: {
    read: (from) => from("updatedAt", (v) => new Date(v)),
  },
});
