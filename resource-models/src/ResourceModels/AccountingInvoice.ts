import { ResourceModel } from "..";

const AccountingInvoice = new ResourceModel({
  id: "accountingInvoice",
  schema: (z) => ({
    invoiceCode: z
      .string()
      .min(1)
      .max(250)
      .describe("Unique invoice identifier (human-readable)"),
    customerContact: z.morph
      .resource("genericContact")
      .optional()
      .describe("The customer's contact associated with the invoice"),
    customerCompany: z.morph
      .resource("genericCompany")
      .optional()
      .describe("The customer's company associated with the invoice"),
    issuedAt: z
      .string()
      .transform((date) => (date ? new Date(date).toISOString() : undefined))
      .optional()
      .describe("Date when the invoice was issued"),
    dueAt: z
      .string()
      .transform((date) => (date ? new Date(date).toISOString() : undefined))
      .optional()
      .describe("Payment due date"),
    paidAt: z
      .string()
      .transform((date) => (date ? new Date(date).toISOString() : undefined))
      .optional()
      .describe("Date the invoice was paid (if applicable)"),
    status: z
      .enum(["draft", "paid", "void", "overdue", "pending"])
      .describe("Invoice state"),

    lineItems: z
      .array(z.morph.resource("accountingInvoiceLineItem"))
      .optional()
      .describe("The line items associated with the invoice"),
    currency: z
      .string()
      .min(3)
      .max(3)
      .describe("ISO currency code (e.g., USD)"),
    preTaxAmount: z.number().min(0).describe("Amount before taxes"),
    taxAmount: z.number().min(0).describe("Total tax applied"),
    totalAmount: z.number().min(0).describe("Final total (with tax)"),
    inclusiveOfTax: z.boolean().describe("Whether prices are tax-inclusive"),
    balance: z.number().min(0).describe("Outstanding balance"),
    note: z
      .string()
      .optional()
      .describe("Internal or external memo / comments"),
  }),
});

export type AccountingInvoice = typeof AccountingInvoice;
export default AccountingInvoice;
