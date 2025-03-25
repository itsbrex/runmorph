import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type AttioWorkspaceMember = {
  id: {
    workspace_id: string;
    workspace_member_id: string;
  };
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  email_address: string;
  access_level: "admin" | "member" | "suspended";
  created_at: string;
};

export default new Mapper<ResourceModels["genericUser"], AttioWorkspaceMember>({
  id: {
    read: (from) => from("id.workspace_member_id"),
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
      read: (from) => from("email_address"),
      write: (to) => to("email_address"),
    },
  },
  createdAt: {
    read: (from) => from("created_at", (v) => new Date(v)),
  },
  updatedAt: {
    read: (from) => from("*", () => new Date()),
  },
});
