import { List } from "@runmorph/cdk";

import ChargebeeInvoiceMapper, { type ChargebeeInvoice } from "./mapper";

interface ChargebeeInvoiceListResponse {
  list: { invoice: ChargebeeInvoice }[];
  next_offset?: string;
}

export default new List({
  scopes: [],
  mapper: ChargebeeInvoiceMapper,
  handler: async (connection, { limit, cursor, q }) => {
    const path = "/v2/invoices";
    const query: Record<string, string> = {};

    // Default limit is 100, max is 100
    const pageSize = Math.min(limit || 100, 100);
    query.limit = pageSize.toString();

    if (cursor) {
      // Decode base64 cursor
      const decodedCursor = Buffer.from(cursor, "base64").toString();
      query.offset = decodedCursor;
    }

    if (q) {
      if (q.type === "text") {
        // Search by invoice ID using starts_with operator
        query["id[starts_with]"] = q.raw;
      } else if (q.type === "email") {
        // Search by customer email
        query["customer_email[is]"] = q.raw;
      }
    }

    const { data, error } =
      await connection.proxy<ChargebeeInvoiceListResponse>({
        method: "GET",
        path,
        query,
      });

    if (error) {
      return { error };
    }

    // Encode next_offset as base64
    const nextCursor = data.next_offset
      ? Buffer.from(data.next_offset).toString("base64")
      : null;

    return {
      data: data.list.map((item) => item.invoice),
      next: nextCursor,
    };
  },
});
