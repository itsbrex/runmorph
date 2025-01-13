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
            `${sf.organizationDomain}-${sf.userId}-${sf.recordType}-${sf.recordId}-${Date.now()}`,
        ),
    },
    fields: {
      triggeredBy: {
        read: (from) =>
          from("*", (sf) =>
            sf.userId
              ? {
                  id: sf.userId,
                }
              : undefined,
          ),
      },
      crmOpportunity: {
        read: (from) =>
          from("*", (sf) =>
            sf.recordType === "Opportunity" && sf.recordId
              ? { id: sf.recordId }
              : undefined,
          ),
      },
      genericCompany: {
        read: (from) =>
          from("*", (sf) =>
            sf.recordType === "Account" && sf.recordId
              ? { id: sf.recordId }
              : undefined,
          ),
      },
      genericContact: {
        read: (from) =>
          from("*", (sf) =>
            sf.recordType === "Contact" && sf.recordId
              ? { id: sf.recordId }
              : undefined,
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
  },
);
