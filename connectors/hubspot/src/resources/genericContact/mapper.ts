import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type HubSpotContact = {
  id: string;
  properties: {
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
};

export default new Mapper<ResourceModels["genericContact"], HubSpotContact>({
  id: {
    read: (from) => from("id"),
  },
  fields: {
    firstName: {
      read: (from) => from("properties.firstname"),
      write: (to) => to("properties.firstname"),
    },
    lastName: {
      read: (from) => from("properties.lastname"),
      write: (to) => to("properties.lastname"),
      key: "lastname",
      filter: "lastname",
    },
    email: {
      read: (from) => from("properties.email"),
      write: (to) => to("properties.email"),
      key: "email",
      filter: "email",
    },
    phone: {
      read: (from) => from("properties.phone"),
      write: (to) => to("properties.phone"),
      key: "phone",
      filter: "phone",
    },
  },
  createdAt: {
    read: (from) => from("createdAt", (v) => new Date(v)),
  },
  updatedAt: {
    read: (from) => from("updatedAt", (v) => new Date(v)),
  },
});
