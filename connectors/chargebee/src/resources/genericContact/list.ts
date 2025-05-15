import { List } from "@runmorph/cdk";
import mapper, { type ChargebeeCustomer } from "./mapper";

interface ChargebeeListResponse {
  list: { customer: ChargebeeCustomer }[];
  next_offset?: string;
}

export default new List({
  mapper,
  scopes: [],
  handler: async (connection, { limit, cursor, fields, q }) => {
    const path = "/v2/customers";
    const query: Record<string, string> = {};

    // Default limit is 10, max is 100
    const pageSize = Math.min(limit || 10, 100);
    query.limit = pageSize.toString();

    if (cursor) {
      // Decode base64 cursor
      const decodedCursor = Buffer.from(cursor, "base64").toString();
      query.offset = decodedCursor;
    }

    if (q) {
      if (q.type === "email") {
        query["email[is]"] = q.raw;
      } else if (q.type === "phone") {
        // Search for different phone number formats
        const phoneFormats = [
          q.raw, // Original format
          q.e164,
          q.internationalNumber,
          q.nationalNumber,
          q.nationalNumberNoSpaces,
          q.internationalNumberNoSpaces,
          q.nationalNumberWithParentheses,
          q.internationalNumber.replace(/\D/g, ""), // Numbers only
        ];

        const responses = await Promise.all(
          phoneFormats.map((phone) =>
            connection.proxy<ChargebeeListResponse>({
              method: "GET",
              path,
              query: {
                ...query,
                "phone[is]": phone,
              },
            })
          )
        );

        // Check for errors
        const error = responses.find((r) => r.error)?.error;
        if (error) {
          return { error };
        }

        // Combine and deduplicate results
        const allResults = responses.flatMap((r) => r.data?.list || []);
        const uniqueResults = allResults.filter(
          (item, index, self) =>
            index === self.findIndex((t) => t.customer.id === item.customer.id)
        );

        // Apply limit after deduplication
        return {
          data: uniqueResults.slice(0, pageSize).map((item) => item.customer),
          next: null, // Pagination not supported for combined results
        };
      } else if (q.type === "text") {
        // Make parallel calls for first name, last name and company
        const responses = await Promise.all([
          connection.proxy<ChargebeeListResponse>({
            method: "GET",
            path,
            query: {
              ...query,
              "first_name[starts_with]": q.raw,
            },
          }),
          connection.proxy<ChargebeeListResponse>({
            method: "GET",
            path,
            query: {
              ...query,
              "last_name[starts_with]": q.raw,
            },
          }),
          connection.proxy<ChargebeeListResponse>({
            method: "GET",
            path,
            query: {
              ...query,
              "company[starts_with]": q.raw,
            },
          }),
        ]);

        // Check for errors
        const error = responses.find((r) => r.error)?.error;
        if (error) {
          return { error };
        }

        // Combine and deduplicate results
        const allResults = responses.flatMap((r) => r.data?.list || []);
        const uniqueResults = allResults.filter(
          (item, index, self) =>
            index === self.findIndex((t) => t.customer.id === item.customer.id)
        );

        // Apply limit after deduplication
        return {
          data: uniqueResults.slice(0, pageSize).map((item) => item.customer),
          next: null, // Pagination not supported for combined results
        };
      }
    }

    const { data, error } = await connection.proxy<ChargebeeListResponse>({
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
      data: data.list.map((item) => item.customer),
      next: nextCursor,
    };
  },
});
