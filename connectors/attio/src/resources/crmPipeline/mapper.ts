import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type AttioStatus = {
  id: {
    workspace_id: string;
    object_id: string;
    attribute_id: string;
    status_id: string;
  };
  title: string;
  is_archived: boolean;
  celebration_enabled: boolean;
  target_time_in_status: string | null;
};

export type AttioObject = {
  id: {
    workspace_id: string;
    object_id: string;
  };
  api_slug: string | null;
  singular_noun: string;
  plural_noun: string | null;
  created_at: string;
  _status?: AttioStatus[];
};

export default new Mapper<ResourceModels["crmPipeline"], AttioObject>({
  id: {
    read: (from) => from("id.object_id"),
  },
  fields: {
    name: {
      read: (from) => from("singular_noun"),
      write: (to) => to("singular_noun"),
    },
    stages: {
      read: (from) =>
        from(
          "_status",
          (v) =>
            v?.map((status) => ({
              id: status.id.status_id,
              rawResource: status,
            })) || []
        ),
      write: (to) =>
        to("_status", (v) =>
          v?.map((stage) => ({ id: { status_id: stage.id } }))
        ),
    },
  },
  createdAt: {
    read: (from) => from("created_at", (v) => new Date(v)),
  },
  updatedAt: {
    read: (from) => from("*", () => new Date()), // Attio doesn't have updatedAt - use current date
  },
});
