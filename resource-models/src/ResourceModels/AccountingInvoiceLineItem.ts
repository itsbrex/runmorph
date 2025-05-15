import { ResourceModel } from "..";

const AccountingInvoiceLineItem = new ResourceModel({
  id: "accountingInvoiceLineItem",
  schema: (z) => ({
    invoice: z.morph
      .resource("accountingInvoice")
      .optional()
      .describe("Related invoice"),
    item: z.morph
      .resource("accountingInvoiceItem")
      .optional()
      .describe("Related item"),
    description: z.string().describe("Name or label of the item"),
    pricePerUnit: z.number().min(0).describe("Price per unit before tax"),
    quantity: z.number().min(0).describe("Quantity of units billed"),
    totalAmount: z
      .number()
      .min(0)
      .describe("Total amount for the line (price × quantity)"),
  }),
});

export type AccountingInvoiceLineItem = typeof AccountingInvoiceLineItem;
export default AccountingInvoiceLineItem;
