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

export default new Mapper<ResourceModels["crmStage"], AttioStatus>({
  id: {
    read: (from) => from("id.status_id"),
  },
  fields: {
    pipeline: {
      read: (from) =>
        from("*", (_) => ({
          id: "deals",
        })),
      write: (to) => to("*", (_) => undefined),
    },
    name: {
      read: (from) => from("title"),
      write: (to) => to("title"),
    },
    type: {
      read: (from) =>
        from("celebration_enabled", (celebration_enabled) => {
          if (celebration_enabled) {
            return "won";
          }
          return "open";
        }),
      write: (to) =>
        to("celebration_enabled", (type) => {
          if (type === "won") {
            return true;
          }
          return false;
        }),
    },
  },
  createdAt: {
    read: (from) => from("*", () => new Date()),
  },
  updatedAt: {
    read: (from) => from("*", () => new Date()),
  },
});
