import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type ChargebeeInvoiceLineItem = {
  amount: number;
  customer_id: string;
  date_from: number;
  date_to: number;
  description: string;
  discount_amount: number;
  entity_id: string;
  entity_type:
    | "adhoc"
    | "plan_item_price"
    | "addon_item_price"
    | "charge_item_price";
  id: string;
  is_taxed: boolean;
  item_level_discount_amount: number;
  object: "line_item";
  pricing_model: "flat_fee" | "per_unit" | "tiered" | "volume" | "stairstep";
  quantity: number;
  tax_amount: number;
  tax_exempt_reason: string;
  unit_amount: number;
  _invoice: {
    id: string;
    date: number;
    updated_at: number;
  };
};

export default new Mapper<
  ResourceModels["accountingInvoiceLineItem"],
  ChargebeeInvoiceLineItem
>({
  id: {
    read: (from) =>
      from("*", (lineItem) => `${lineItem._invoice.id}::${lineItem.id}`),
  },
  fields: {
    invoice: {
      read: (from) =>
        from("_invoice", (invoice) => ({
          id: invoice.id,
          rawResource: invoice,
        })),
    },
    item: {
      read: (from) =>
        from("*", (lineItem) =>
          lineItem.entity_type.endsWith("item_price") && lineItem.entity_id
            ? {
                id: lineItem.entity_id,
              }
            : undefined
        ),
      write: (to) =>
        to("*", (item) => {
          if (item.id) {
            return { entity_id: item.id };
          }
          return undefined;
        }),
    },
    description: {
      read: (from) => from("description"),
      write: (to) => to("description"),
    },
    pricePerUnit: {
      read: (from) => from("unit_amount"),
      write: (to) => to("unit_amount"),
    },
    quantity: {
      read: (from) => from("quantity"),
      write: (to) => to("quantity"),
    },
    totalAmount: {
      read: (from) => from("amount"),
      write: (to) => to("amount"),
    },
  },
  createdAt: {
    read: (from) => from("_invoice.date", (date) => new Date(date * 1000)),
  },
  updatedAt: {
    read: (from) =>
      from("_invoice.updated_at", (updated_at) => new Date(updated_at * 1000)),
  },
});
