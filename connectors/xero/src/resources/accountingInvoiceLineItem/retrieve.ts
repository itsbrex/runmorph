import { Retrieve } from "@runmorph/cdk";

import { type XeroInvoice } from "../accountingInvoice/mapper";

import XeroInvoiceLineItemMapper from "./mapper";

export default new Retrieve({
  scopes: ["accounting.transactions.read"],
  mapper: XeroInvoiceLineItemMapper,
  handler: async (connection, input) => {
    const [invoiceId, lineItemId] = input.id.split("::");

    if (!invoiceId || !lineItemId) {
      return {
        error: {
          code: "MORPH::BAD_REQUEST" as const,
          message: "Invalid line item ID format",
        },
      };
    }

    const { data, error } = await connection.proxy<{ Invoices: XeroInvoice[] }>(
      {
        method: "GET",
        path: `/api.xro/2.0/invoices/${invoiceId}`,
      }
    );

    if (error) {
      return { error };
    }

    const invoice = data.Invoices[0];
    const lineItem = invoice.LineItems.find(
      (item) => item.LineItemID === lineItemId
    );

    if (!lineItem) {
      return {
        error: {
          code: "CONNECTOR::OPERATION::RESOURCE_NOT_FOUND" as const,
          message: "Line item not found",
        },
      };
    }

    return {
      ...lineItem,
      _invoice: invoice,
    };
  },
});
