import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type SalesforceUser = {
  Id: string;
  Email: string;
  FirstName: string;
  LastName: string;
  CreatedDate: string;
  LastModifiedDate: string;
};

export default new Mapper<ResourceModels["genericUser"], SalesforceUser>({
  id: {
    read: (from) => from("Id"),
    key: "Id",
  },
  fields: {
    email: {
      read: (from) => from("Email"),
      write: (to) => to("Email"),
      key: "Email",
    },
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
