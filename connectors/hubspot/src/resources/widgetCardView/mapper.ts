import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

type HubSpotDataType = "STRING" | "STATUS" | "LINK";
type HubSpotActionType = "IFRAME" | "ACTION_HOOK" | "CONFIRMATION_ACTION_HOOK";

export type HubSpotCardViewRequestAndResponse = {
  portalId: string;
  associatedObjectType: "DEAL" | "CONTACT" | "COMPANY";
  hs_object_id: string;
  userId: string;
  // Expected response
  results: Array<{
    objectId: number;
    title: string;
    link?: string;
    created: string;
    priority: string;
    actions?: Array<{
      type: HubSpotActionType;
      width?: number;
      height?: number;
      uri: string;
      label: string;
      associatedObjectProperties?: string[];
      httpMethod?: string;
      confirmationMessage?: string;
      confirmButtonText?: string;
      cancelButtonText?: string;
    }>;
    properties?: Array<{
      label: string;
      dataType: HubSpotDataType;
      value: string | number;
      currencyCode?: string;
    }>;
  }>;
  primaryAction?: {
    type: HubSpotActionType;
    width?: number;
    height?: number;
    uri: string;
    label: string;
  };
  secondaryActions?: Array<{
    type: HubSpotActionType;
    width?: number;
    height?: number;
    uri: string;
    label: string;
    associatedObjectProperties?: string[];
    httpMethod?: string;
    confirmationMessage?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
  }>;
};

export default new Mapper<
  ResourceModels["widgetCardView"],
  HubSpotCardViewRequestAndResponse
>(
  {
    id: {
      read: (from) =>
        from(
          "*",
          (event) =>
            `${event.portalId.toString()}-${event.userId}-${event.associatedObjectType}-${event.hs_object_id}`
        ),
    },
    fields: {
      triggeredBy: {
        read: (from) => from("userId", (v) => ({ id: v })),
      },
      crmOpportunity: {
        read: (from) =>
          from("*", (v) =>
            v.associatedObjectType === "DEAL"
              ? { id: v.hs_object_id }
              : undefined
          ),
      },
      genericCompany: {
        read: (from) =>
          from("*", (v) =>
            v.associatedObjectType === "COMPANY"
              ? { id: v.hs_object_id }
              : undefined
          ),
      },
      genericContact: {
        read: (from) =>
          from("*", (v) =>
            v.associatedObjectType === "CONTACT"
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
  },
  // Card Response Mapper
  {
    cards: {
      write: (to) =>
        to("results", (cards) =>
          cards.map((card) => ({
            objectId: Math.random(),
            title: card.title,
            link: card.link,
            actions: card.actions?.map((action) => {
              const uri = action.url;
              return {
                type: "IFRAME" as HubSpotActionType,
                uri,
                label: action.label,
                width: 1300,
                height: 900,
              };
            }),
            properties: card.contents?.map((content) => {
              if (content.type === "status") {
                return {
                  label: content.label,
                  dataType: "STATUS" as HubSpotDataType,
                  value: content.value,
                  optionType: content.status.toUpperCase(),
                };
              }
              if (content.link) {
                return {
                  label: content.label,
                  dataType: "LINK" as HubSpotDataType,
                  value: content.link,
                  linkLabel: content.value,
                };
              }
              return {
                label: content.label,
                dataType: "STRING" as HubSpotDataType,
                value: content.value,
              };
            }),
          }))
        ),
    },
    root: {
      write: (to) =>
        to("*", (root) => {
          if (!root.actions?.length) return {};

          const [primaryAction, ...secondaryActions] = root.actions;
          const result: Partial<HubSpotCardViewRequestAndResponse> = {};

          if (primaryAction) {
            const uri = primaryAction.url;

            result.primaryAction = {
              type: "IFRAME",
              uri,
              label: primaryAction.label,
              width: 1300,
              height: 900,
            };
          }

          if (secondaryActions.length) {
            result.secondaryActions = secondaryActions.map((action) => {
              const uri = action.url;

              return {
                type: "IFRAME",
                uri,
                label: action.label,
                width: 1300,
                height: 900,
              };
            });
          }
          return result;
        }),
    },
  }
);
