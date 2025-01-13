import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type SalesforceContact = {
  Id: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  CreatedDate: string;
  LastModifiedDate: string;
};

export default new Mapper<ResourceModels["genericContact"], SalesforceContact>({
  id: {
    read: (from) => from("Id"),
    key: "Id",
  },
  fields: {
    firstName: {
      read: (from) => from("FirstName"),
      write: (to) => to("FirstName"),
      key: "FirstName",
    },
    lastName: {
      read: (from) => from("LastName"),
      write: (to) => to("LastName"),
      key: "LastName",
    },
    phone: {
      read: (from) => from("Phone"),
      write: (to) => to("Phone"),
      key: "Phone",
    },
    email: {
      read: (from) => from("Email"),
      write: (to) => to("Email"),
      key: "Email",
    },
  },
  createdAt: {
    read: (from) => from("CreatedDate", (v) => new Date(v)),
    key: "CreatedDate",
  },
  updatedAt: {
    read: (from) => from("LastModifiedDate", (v) => new Date(v)),
    key: "LastModifiedDate",
  },
});
