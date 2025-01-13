import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type SalesforceAccount = {
  Id: string;
  Name: string;
  CreatedDate: string;
  LastModifiedDate: string;
};

export default new Mapper<ResourceModels["genericCompany"], SalesforceAccount>({
  id: {
    read: (from) => from("Id"),
    key: "Id",
  },
  fields: {
    name: {
      read: (from) => from("Name"),
      write: (to) => to("Name"),
      key: "Name",
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
