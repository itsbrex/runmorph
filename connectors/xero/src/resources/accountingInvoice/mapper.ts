import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type XeroInvoice = {
  InvoiceID: string;
  InvoiceNumber: string;
  Type: string;
  Contact: {
    ContactID: string;
    Name: string;
    EmailAddress?: string;
  };
  DateString: string;
  DueDateString: string;
  Status: "DRAFT" | "SUBMITTED" | "AUTHORISED" | "VOIDED" | "DELETED";
  LineAmountTypes: string;
  LineItems: Array<{
    LineItemID: string;
    Description: string;
    UnitAmount: number;
    Quantity: number;
    LineAmount: number;
  }>;
  SubTotal: number;
  TotalTax: number;
  Total: number;
  AmountDue: number;
  CurrencyCode: string;
  FullyPaidOnDate?: string;
  Reference: string;
};

export default new Mapper<ResourceModels["accountingInvoice"], XeroInvoice>({
  id: {
    read: (from) => from("InvoiceID"),
  },
  fields: {
    invoiceCode: {
      read: (from) => from("InvoiceNumber"),
      write: (to) => to("InvoiceNumber"),
    },
    customerContact: {
      read: (from) =>
        from("Contact", (contact) =>
          contact
            ? {
                id: contact.ContactID,
                rawResource: contact,
              }
            : undefined
        ),
    },
    customerCompany: {
      read: (from) =>
        from("Contact", (contact) =>
          contact
            ? {
                id: contact.ContactID,
                rawResource: contact,
              }
            : undefined
        ),
    },
    issuedAt: {
      read: (from) => from("DateString"),
      write: (to) => to("DateString"),
    },
    dueAt: {
      read: (from) => from("DueDateString"),
      write: (to) => to("DueDateString"),
    },
    paidAt: {
      read: (from) => from("FullyPaidOnDate", (date) => date),
    },
    status: {
      read: (from) =>
        from("*", (invoice) => {
          if (invoice.FullyPaidOnDate) {
            return "paid";
          }

          const dueDate = new Date(invoice.DueDateString);
          const now = new Date();

          if (!invoice.FullyPaidOnDate && dueDate < now) {
            return "overdue";
          }

          switch (invoice.Status) {
            case "DRAFT":
              return "draft";
            case "SUBMITTED":
              return "pending";
            case "AUTHORISED":
              return "pending";
            case "VOIDED":
              return "void";
            case "DELETED":
              return "void";
            default:
              return "pending";
          }
        }),
    },
    lineItems: {
      read: (from) =>
        from("*", (invoice) =>
          invoice.LineItems.map((item) => ({
            id: `${invoice.InvoiceID}::${item.LineItemID}`,
            rawResource: { ...item, _invoice: invoice },
          }))
        ),
    },
    currency: {
      read: (from) => from("CurrencyCode"),
      write: (to) => to("CurrencyCode"),
    },
    preTaxAmount: {
      read: (from) => from("SubTotal"),
      write: (to) => to("SubTotal"),
    },
    taxAmount: {
      read: (from) => from("TotalTax"),
      write: (to) => to("TotalTax"),
    },
    totalAmount: {
      read: (from) => from("Total"),
      write: (to) => to("Total"),
    },
    inclusiveOfTax: {
      read: (from) => from("LineAmountTypes", (type) => type === "Inclusive"),
      write: (to) =>
        to("LineAmountTypes", (inclusive) =>
          inclusive ? "Inclusive" : "Exclusive"
        ),
    },
    balance: {
      read: (from) => from("AmountDue"),
      write: (to) => to("AmountDue"),
    },
    note: {
      read: (from) => from("Reference"),
      write: (to) => to("Reference"),
    },
  },
  createdAt: {
    read: (from) => from("DateString", (date) => new Date(date)),
  },
  updatedAt: {
    read: (from) => from("DateString", (date) => new Date(date)),
  },
});
