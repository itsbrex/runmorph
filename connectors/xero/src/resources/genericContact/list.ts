import { List } from "@runmorph/cdk";

import XeroContactMapper, { type XeroContact } from "./mapper";

interface XeroContactListResponse {
  Contacts: XeroContact[];
}

export default new List({
  scopes: ["accounting.contacts.read"],
  mapper: XeroContactMapper,
  handler: async (connection, { limit, cursor, q }) => {
    const path = "/api.xro/2.0/contacts";
    const query: Record<string, string> = {};

    // Default limit is 100, max is 1000
    const pageSize = Math.min(limit || 100, 1000);
    query.pageSize = pageSize.toString();

    if (q) {
      if (q.type === "email") {
        query.where = `EmailAddress="${q.raw}"`;
      } else if (q.type === "text") {
        query.SearchTerm = q.raw;
      }
    }

    if (cursor) {
      query.page = cursor;
    }

    const { data, error } = await connection.proxy<XeroContactListResponse>({
      method: "GET",
      path,
      query,
    });

    if (error) {
      return { error };
    }

    // Determine if there's a next page based on returned results vs requested limit
    const hasNextPage = data.Contacts.length === pageSize;
    const currentPage = cursor ? parseInt(cursor) : 1;
    const nextCursor = hasNextPage ? (currentPage + 1).toString() : null;

    return {
      data: data.Contacts,
      next: nextCursor,
    };
  },
});
