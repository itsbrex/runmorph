import { Retrieve } from "@runmorph/cdk";

import type { ChargebeeInvoiceLineItem } from "./mapper";
import InvoiceLineItemMapper from "./mapper";

export default new Retrieve({
  scopes: [],
  mapper: InvoiceLineItemMapper,
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

    const { data, error } = await connection.proxy<{
      invoice: {
        line_items: ChargebeeInvoiceLineItem[];
        id: string;
        date: number;
        updated_at: number;
      };
    }>({
      method: "GET",
      path: `/v2/invoices/${invoiceId}`,
    });

    if (error) {
      return { error };
    }

    const lineItem = data.invoice.line_items.find(
      (item) => item.id === lineItemId
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
      _invoice: data.invoice,
    };
  },
});
