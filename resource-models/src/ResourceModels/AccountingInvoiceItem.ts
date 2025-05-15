import { ResourceModel } from "..";

const AccountingInvoiceItem = new ResourceModel({
  id: "accountingInvoiceItem",
  schema: (z) => ({
    name: z.string().describe("Human-readable name of the item"),
    description: z
      .string()
      .optional()
      .describe("Long-form explanation of the item"),
    code: z.string().optional().describe("External identifier (SKU, code)"),
    price: z
      .number()
      .min(0)
      .optional()
      .describe("Default price per unit (excl. tax)"),
    currency: z
      .string()
      .optional()
      .describe("Currency for this item's pricing"),
  }),
});

export type AccountingInvoiceItem = typeof AccountingInvoiceItem;
export default AccountingInvoiceItem;
