import { List } from "@runmorph/cdk";

import mapper, { type XeroInvoiceItem } from "./mapper";

interface XeroItemListResponse {
  Items: XeroInvoiceItem[];
}

export default new List({
  scopes: ["accounting.settings.read"],
  mapper,
  handler: async (connection, { limit, cursor, q }) => {
    const path = "/api.xro/2.0/Items";
    const query: Record<string, string> = {};

    // Default limit is 100, max is 100
    const pageSize = Math.min(limit || 100, 100);
    query.page = cursor || "1";

    if (q) {
      if (q.type === "text") {
        // Search across Name, Code and Description fields
        query.where = `Name.Contains("${q.raw}") OR Code.Contains("${q.raw}") OR Description.Contains("${q.raw}")`;
      }
    }

    const { data: itemData, error: itemError } =
      await connection.proxy<XeroItemListResponse>({
        method: "GET",
        path,
        query,
      });

    if (itemError) {
      return { error: itemError };
    }

    // Get organization data for currency
    const { data: orgData, error: orgError } = await connection.proxy<{
      Organisations: Array<{ BaseCurrency: string }>;
    }>({
      method: "GET",
      path: "/api.xro/2.0/Organisation",
    });

    if (orgError) {
      return { error: orgError };
    }

    // Add organization data to each item
    const items = itemData.Items.map((item) => ({
      ...item,
      _organization: {
        BaseCurrency: orgData.Organisations[0].BaseCurrency,
      },
    }));

    // Determine if there's a next page based on returned results vs requested limit
    const hasNextPage = items.length === pageSize;
    const currentPage = cursor ? parseInt(cursor) : 1;
    const nextCursor = hasNextPage ? (currentPage + 1).toString() : null;

    return {
      data: items,
      next: nextCursor,
    };
  },
});
