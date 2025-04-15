import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type DialpadContact = {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  company_name: string;
  job_title: string;
  owner_id: string;
  type: "local" | "shared";
  extension?: string;
  primary_email: string;
  primary_phone: string;
  emails: string[];
  phones: string[];
  urls: string[];
  trunk_group?: string;
};

export default new Mapper<ResourceModels["genericContact"], DialpadContact>({
  id: {
    read: (from) => from("id"),
  },
  fields: {
    firstName: {
      read: (from) => from("first_name"),
    },
    lastName: {
      read: (from) => from("last_name"),
    },
    email: {
      read: (from) => from("primary_email"),
    },
    phone: {
      read: (from) =>
        from("primary_phone", (phone) => phone?.replace(/\s/g, "")),
    },
  },
  createdAt: {
    read: (from) => from("id", () => new Date()),
  },
  updatedAt: {
    read: (from) => from("id", () => new Date()),
  },
});
