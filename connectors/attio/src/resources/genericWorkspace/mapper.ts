import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type AttioWorkspace = {
  active: boolean;
  scope: string;
  client_id: string;
  token_type: string;
  exp: number | null;
  iat: number;
  sub: string;
  aud: string;
  iss: string;
  authorized_by_workspace_member_id: string | null;
  workspace_id: string;
  workspace_name: string;
  workspace_slug: string;
  workspace_logo_url: string | null;
};

export default new Mapper<ResourceModels["genericWorkspace"], AttioWorkspace>({
  id: {
    read: (from) => from("workspace_id"),
  },
  fields: {
    name: {
      read: (from) => from("workspace_name"),
      write: (to) => to("workspace_name"),
    },
  },
  createdAt: {
    read: (from) => from("iat", (v) => new Date(v * 1000)),
  },
  updatedAt: {
    read: (from) => from("*", () => new Date()),
  },
});
