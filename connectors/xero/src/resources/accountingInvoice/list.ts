import { List } from "@runmorph/cdk";

import XeroInvoiceMapper, { type XeroInvoice } from "./mapper";

interface XeroInvoiceListResponse {
  Invoices: XeroInvoice[];
}

export default new List({
  scopes: ["accounting.transactions.read"],
  mapper: XeroInvoiceMapper,
  handler: async (connection, { limit, cursor, q }) => {
    const path = "/api.xro/2.0/invoices";
    const query: Record<string, string> = {};

    // Default limit is 100, max is 100
    const pageSize = Math.min(limit || 100, 100);
    query.page = cursor || "1";

    if (q) {
      if (q.type === "text") {
        // Search across InvoiceNumber and Reference fields
        query.SearchTerm = q.raw;
      } else if (q.type === "email") {
        // Search by contact email
        query.where = `Contact.EmailAddress="${q.raw}"`;
      }
    }

    const { data, error } = await connection.proxy<XeroInvoiceListResponse>({
      method: "GET",
      path,
      query,
    });

    if (error) {
      return { error };
    }

    // Determine if there's a next page based on returned results vs requested limit
    const hasNextPage = data.Invoices.length === pageSize;
    const currentPage = cursor ? parseInt(cursor) : 1;
    const nextCursor = hasNextPage ? (currentPage + 1).toString() : null;

    return {
      data: data.Invoices,
      next: nextCursor,
    };
  },
});
