import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type ChargebeeInvoice = {
  id: string;
  po_number: string;
  customer_id: string;
  subscription_id?: string;
  recurring: boolean;
  status: "paid" | "posted" | "payment_due" | "not_paid" | "voided" | "pending";
  price_type: "tax_exclusive" | "tax_inclusive";
  date: number;
  due_date: number;
  currency_code: string;
  total: number;
  amount_paid: number;
  amount_adjusted: number;
  write_off_amount: number;
  credits_applied: number;
  amount_due: number;
  paid_at?: number;
  sub_total: number;
  tax: number;
  line_items: Array<{
    id: string;
    description: string;
    unit_amount: number;
    quantity: number;
    amount: number;
    date_from: number;
    date_to: number;
  }>;
  billing_address?: {
    first_name?: string;
    last_name?: string;
  };
  shipping_address?: {
    first_name?: string;
    last_name?: string;
  };
};

export default new Mapper<
  ResourceModels["accountingInvoice"],
  ChargebeeInvoice
>({
  id: {
    read: (from) => from("id"),
  },
  fields: {
    invoiceCode: {
      read: (from) => from("id"),
      write: (to) => to("id"),
    },
    customerContact: {
      read: (from) =>
        from("customer_id", (customer_id) => {
          return {
            id: customer_id,
          };
        }),
      write: (to) =>
        to("customer_id", (customerCompany) => {
          return customerCompany.id;
        }),
    },
    customerCompany: {
      read: (from) =>
        from("customer_id", (customer_id) => {
          return {
            id: customer_id,
          };
        }),
      write: (to) =>
        to("customer_id", (customerCompany) => {
          return customerCompany.id;
        }),
    },
    issuedAt: {
      read: (from) =>
        from("date", (date) => new Date(date * 1000).toISOString()),
      write: (to) =>
        to("date", (issuedAt) => new Date(issuedAt).getTime() / 1000),
    },
    dueAt: {
      read: (from) =>
        from("due_date", (due_date) => new Date(due_date * 1000).toISOString()),
      write: (to) =>
        to("due_date", (dueAt) => new Date(dueAt).getTime() / 1000),
    },
    paidAt: {
      read: (from) =>
        from("paid_at", (paid_at) =>
          paid_at ? new Date(paid_at * 1000).toISOString() : undefined
        ),
      write: (to) =>
        to("paid_at", (paidAt) =>
          paidAt ? new Date(paidAt).getTime() / 1000 : undefined
        ),
    },
    status: {
      read: (from) =>
        from("status", (status) => {
          switch (status) {
            case "paid":
              return "paid";
            case "voided":
              return "void";
            case "payment_due":
            case "posted":
              return "overdue";
            case "not_paid":
              return "pending";
            case "pending":
              return "draft";
            default:
              return "pending";
          }
        }),
    },
    lineItems: {
      read: (from) =>
        from("*", (invoice) =>
          invoice.line_items.map((item) => ({
            id: `${invoice.id}::${item.id}`,
            rawResource: { ...item, _invoice: invoice },
          }))
        ),
    },
    currency: {
      read: (from) => from("currency_code"),
      write: (to) => to("currency_code"),
    },
    preTaxAmount: {
      read: (from) => from("sub_total"),
      write: (to) => to("sub_total"),
    },
    taxAmount: {
      read: (from) => from("tax"),
      write: (to) => to("tax"),
    },
    totalAmount: {
      read: (from) => from("total"),
      write: (to) => to("total"),
    },
    inclusiveOfTax: {
      read: (from) => from("price_type", (type) => type === "tax_inclusive"),
      write: (to) =>
        to("price_type", (inclusive) =>
          inclusive ? "tax_inclusive" : "tax_exclusive"
        ),
    },
    balance: {
      read: (from) => from("amount_due"),
      write: (to) => to("amount_due"),
    },
    note: {
      read: (from) => from("po_number"),
      write: (to) => to("po_number"),
    },
  },
  createdAt: {
    read: (from) => from("date", (date) => new Date(date * 1000)),
  },
  updatedAt: {
    read: (from) => from("date", (date) => new Date(date * 1000)),
  },
});
