import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type SalesforceOpportunity = {
  Id: string;
  Name: string;
  Description: string;
  Amount: number;
  StageName: string;
  Probability: number;
  CloseDate: string;
  ContactId: string;
  AccountId: string;
  OwnerId?: string;
  CreatedDate: string;
  LastModifiedDate: string;
  // Added value
  stageId?: string;
};

export default new Mapper<
  ResourceModels["crmOpportunity"],
  SalesforceOpportunity
>({
  id: {
    read: (from) => from("Id", (id) => id.substring(0, 15)),
    key: "Id",
  },
  fields: {
    name: {
      read: (from) => from("Name"),
      write: (to) => to("Name"),
      key: "Name",
    },
    amount: {
      read: (from) => from("Amount"),
      write: (to) => to("Amount"),
      key: "Amount",
    },
    pipeline: {
      // Opportunity Object have it own unique pipeline
      read: (from) =>
        from("StageName", () => ({
          id: "Opportunity",
        })),
    },
    stage: {
      read: (from) =>
        from("stageId", (stageId) =>
          stageId
            ? {
                id: stageId.substring(0, 15),
              }
            : undefined
        ),
      write: (to) => to("stageId", (stage) => stage.id),
      key: "StageName",
    },
    owner: {
      read: (from) =>
        from("OwnerId", (OwnerId) =>
          OwnerId
            ? {
                id: OwnerId.substring(0, 15),
              }
            : undefined
        ),
      write: (to) => to("OwnerId", (owner) => owner.id),
      key: "OwnerId",
    },
    contacts: {
      read: (from) =>
        from("ContactId", (ContactId) =>
          ContactId ? [{ id: ContactId.substring(0, 15) }] : undefined
        ),
      write: (to) =>
        to("ContactId", (companies) =>
          companies[0] ? companies[0].id.substring(0, 15) : undefined
        ),
      key: "ContactId",
    },
    companies: {
      read: (from) =>
        from("AccountId", (AccountId) =>
          AccountId ? [{ id: AccountId.substring(0, 15) }] : undefined
        ),
      write: (to) =>
        to("AccountId", (companies) =>
          companies[0] ? companies[0].id.substring(0, 15) : undefined
        ),
      key: "AccountId",
    },
  },
  createdAt: {
    read: (from) => from("CreatedDate", (v) => new Date(v)),
    key: "CreatedDate",
  },
  updatedAt: {
    read: (from) => from("LastModifiedDate", (v) => new Date(v)),
    key: "LastModifiedDate",
  },
});
