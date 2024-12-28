import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type HubSpotCardViewRequest = {
  portalId: string;
  associatedObjectType: "deal" | "contact" | "company";
  hs_object_id: string;
  userId: string;
};

export default new Mapper<
  ResourceModels["widgetCardViewRequest"],
  HubSpotCardViewRequest
>({
  id: {
    read: (from) => from("portalId", (v) => `${v.toString()}-${Date.now()}`),
  },
  fields: {
    genericUser: {
      read: (from) => from("userId", (v) => ({ id: v })),
    },
    crmOpportunity: {
      read: (from) =>
        from("*", (v) =>
          v.associatedObjectType === "deal" ? { id: v.hs_object_id } : undefined
        ),
    },
    genericCompany: {
      read: (from) =>
        from("*", (v) =>
          v.associatedObjectType === "company"
            ? { id: v.hs_object_id }
            : undefined
        ),
    },
    genericContact: {
      read: (from) =>
        from("*", (v) =>
          v.associatedObjectType === "contact"
            ? { id: v.hs_object_id }
            : undefined
        ),
    },
  },
  createdAt: {
    read: (from) => from("*", () => new Date()),
  },
  updatedAt: {
    read: (from) => from("*", () => new Date()),
  },
});
