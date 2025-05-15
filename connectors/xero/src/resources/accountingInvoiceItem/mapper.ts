import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type XeroInvoiceItem = {
  ItemID: string;
  Code: string;
  Name: string;
  IsSold: boolean;
  IsPurchased: boolean;
  Description: string;
  PurchaseDescription?: string;
  IsTrackedAsInventory: boolean;
  InventoryAssetAccountCode?: string;
  TotalCostPool?: number;
  QuantityOnHand?: number;
  UpdatedDateUTC: string;
  SalesDetails: {
    UnitPrice: number;
    AccountCode?: string;
    TaxType?: string;
  };
  _organization: {
    BaseCurrency: string;
  };
};

export default new Mapper<
  ResourceModels["accountingInvoiceItem"],
  XeroInvoiceItem
>({
  id: {
    read: (from) => from("ItemID"),
  },
  fields: {
    name: {
      read: (from) => from("Name"),
      write: (to) => to("Name"),
    },
    description: {
      read: (from) => from("Description"),
      write: (to) => to("Description"),
    },
    code: {
      read: (from) => from("Code"),
      write: (to) => to("Code"),
    },
    price: {
      read: (from) => from("SalesDetails.UnitPrice", (price) => price || 0),
      write: (to) => to("SalesDetails.UnitPrice"),
    },
    currency: {
      read: (from) => from("_organization.BaseCurrency"),
    },
  },
  createdAt: {
    read: (from) =>
      from("UpdatedDateUTC", (date) => {
        if (!date) return undefined;
        // Convert Xero date format "/Date(1488391422280+0000)/" to Date
        const timestamp = parseInt(date.match(/\d+/)?.[0] || "0");
        return timestamp ? new Date(timestamp) : undefined;
      }),
  },
  updatedAt: {
    read: (from) =>
      from("UpdatedDateUTC", (date) => {
        if (!date) return undefined;
        // Convert Xero date format "/Date(1488391422280+0000)/" to Date
        const timestamp = parseInt(date.match(/\d+/)?.[0] || "0");
        return timestamp ? new Date(timestamp) : undefined;
      }),
  },
});
