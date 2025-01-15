import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type SalesforceCardViewRequest = {
  organizationDomain?: string;
  userId?: string;
  recordType?: "Account" | "Contact" | "Opportunity";
  recordId?: string;
};

type SalesforceCardViewRequestAndResponse = SalesforceCardViewRequest &
  SalesforceCardView; // Expected response;

type Content = {
  label: string;
  value: string;
  type: "text" | "status";
  status?: string;
  link?: string;
};

type Action = {
  label: string;
  url: string;
  type: string;
};

type Card = {
  title: string;
  contents: Content[];
  actions?: Action[];
  link?: string;
};

type SalesforceCardView = {
  cards: Card[];
  root: {
    actions: Action[];
  };
};

export default new Mapper<
  ResourceModels["widgetCardView"],
  SalesforceCardViewRequestAndResponse
>(
  {
    id: {
      read: (from) =>
        from(
          "*",
          (sf) =>
            `${sf.organizationDomain}-${sf.userId}-${sf.recordType}-${sf.recordId}-${Date.now()}`
        ),
    },
    fields: {
      // @ts-ignore -- Union too complex during build runtime
      triggeredBy: {
        read: (from) =>
          from("userId", (userId) =>
            userId
              ? {
                  id: userId,
                }
              : undefined
          ),
      },
      // @ts-ignore -- Union too complex during build runtime
      crmOpportunity: {
        read: (from) =>
          from("recordId", (recordId, sf) =>
            sf.recordType === "Opportunity" && recordId
              ? { id: recordId }
              : undefined
          ),
      },
      // @ts-ignore -- Union too complex during build runtime
      genericCompany: {
        read: (from) =>
          from("recordId", (recordId, sf) =>
            sf.recordType === "Account" && recordId
              ? { id: recordId }
              : undefined
          ),
      },
      // @ts-ignore -- Union too complex during build runtime
      genericContact: {
        read: (from) =>
          from("recordId", (recordId, sf) =>
            sf.recordType === "Contact" && recordId
              ? { id: recordId }
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
      write: (to) => to("cards", (cards) => cards),
    },
    root: {
      write: (to) => to("root", (root) => root),
    },
  }
);
