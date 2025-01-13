import { List } from "@runmorph/cdk";

import SalesforceContactMapper, { type SalesforceContact } from "./mapper";

interface SalesforceQueryResponse {
  records: SalesforceContact[];
  done: boolean;
  totalSize: number;
}

export default new List({
  scopes: [],
  mapper: SalesforceContactMapper,
  handler: async (connection, { limit, cursor, fields }) => {
    // Build SOQL query
    let q = "SELECT ";

    // Add fields
    q += fields.join(", ");

    q += " FROM Contact";

    // Add LIMIT clause
    q += ` LIMIT ${limit}`;

    // Add OFFSET is defined
    if (cursor) {
      q += ` OFFSET ${cursor}`;
    }

    const { data, error } = await connection.proxy<SalesforceQueryResponse>({
      method: "GET",
      path: "/query",
      query: {
        q,
      },
    });

    if (error) {
      return { error };
    }

    // Assume there are more results if the number of records returned equals the limit
    let next = null;
    if (data.records.length === limit) {
      next = cursor
        ? `${parseInt(cursor) + data.records.length}`
        : `${data.records.length}`;
    }

    return {
      data: data.records,
      next,
    };
  },
});
