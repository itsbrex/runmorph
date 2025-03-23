import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type SalesforceOrganization = {
  Id: string;
  Name: string;
  CreatedDate: string;
  LastModifiedDate: string;
};

export default new Mapper<
  ResourceModels["genericWorkspace"],
  SalesforceOrganization
>({
  id: {
    read: (from) => from("Id", (id) => id.substring(0, 15)),
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
