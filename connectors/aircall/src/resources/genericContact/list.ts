import { List } from "@runmorph/cdk";

import mapper, { type AircallContact } from "./mapper";

interface AircallContactListResponse {
  contacts: AircallContact[];
  meta: {
    count: number;
    total: number;
    current_page: number;
    per_page: number;
    next_page_link: string | null;
    previous_page_link: string | null;
  };
}

export default new List({
  scopes: [],
  mapper,
  handler: async (connection, { limit, cursor }) => {
    const page = cursor ? parseInt(cursor) : 1;
    const perPage = limit || 20;

    const { data, error } = await connection.proxy<AircallContactListResponse>({
      method: "GET",
      path: "/v1/contacts",
      query: {
        page,
        per_page: perPage,
        order_by: "desc",
      },
    });

    if (error) {
      return { error };
    }

    return {
      data: data.contacts,
      next: data.meta.next_page_link ? (page + 1).toString() : null,
    };
  },
});
