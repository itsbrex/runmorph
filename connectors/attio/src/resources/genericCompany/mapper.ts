import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

import { AttioAttributeValue } from "@/types";

export type AttioCompany = {
  id: {
    workspace_id: string;
    object_id: string;
    record_id: string;
  };
  created_at: string;
  values: {
    record_id: AttioAttributeValue;
    name: AttioAttributeValue;
    description: AttioAttributeValue;
    domains: AttioAttributeValue<{
      domain: string;
      root_domain: string;
    }>;
    team: Array<{
      target_object: string;
      target_record_id: string;
      attribute_type: string;
      active_from: string;
      active_until: string | null;
      created_by_actor: {
        type: string;
        id: string;
      };
    }>;
    categories: Array<{
      option: {
        id: {
          workspace_id: string;
          object_id: string;
          attribute_id: string;
          option_id: string;
        };
        title: string;
        is_archived: boolean;
      };
      attribute_type: string;
      active_from: string;
      active_until: string | null;
      created_by_actor: {
        type: string;
        id: string | null;
      };
    }>;
  };
};

export default new Mapper<ResourceModels["genericCompany"], AttioCompany>({
  id: {
    read: (from) => from("id.record_id"),
  },
  fields: {
    name: {
      read: (from) => from("values.name.0.value"),
      write: (to) => to("values.name.0.value"),
    },
  },
  createdAt: {
    read: (from) => from("created_at", (v) => new Date(v)),
  },
  updatedAt: {
    read: (from) => from("*", () => new Date()), // Attio doesn't have updatedAt - use current date
  },
});
