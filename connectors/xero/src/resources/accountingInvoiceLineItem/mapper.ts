import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

import type { XeroInvoice } from "../accountingInvoice/mapper";

export type XeroInvoiceLineItem = {
  LineItemID: string;
  Description: string;
  UnitAmount: number;
  Quantity: number;
  LineAmount: number;
  Item?: {
    ItemID: string;
    Name: string;
    Code: string;
  };
  _invoice: XeroInvoice;
};

export default new Mapper<
  ResourceModels["accountingInvoiceLineItem"],
  XeroInvoiceLineItem
>({
  id: {
    read: (from) =>
      from(
        "*",
        (lineItem) => `${lineItem._invoice.InvoiceID}::${lineItem.LineItemID}`
      ),
  },
  fields: {
    invoice: {
      read: (from) =>
        from("_invoice", (invoice) => ({
          id: invoice.InvoiceID,
          rawResource: invoice,
        })),
    },
    item: {
      read: (from) =>
        from("Item", (item) =>
          item
            ? {
                id: item.ItemID,
              }
            : undefined
        ),
    },
    description: {
      read: (from) => from("Description"),
      write: (to) => to("Description"),
    },
    pricePerUnit: {
      read: (from) => from("UnitAmount"),
      write: (to) => to("UnitAmount"),
    },
    quantity: {
      read: (from) => from("Quantity"),
      write: (to) => to("Quantity"),
    },
    totalAmount: {
      read: (from) => from("LineAmount"),
      write: (to) => to("LineAmount"),
    },
  },
  createdAt: {
    read: (from) => from("_invoice.DateString", (date) => new Date(date)),
  },
  updatedAt: {
    read: (from) => from("_invoice.DateString", (date) => new Date(date)),
  },
});
