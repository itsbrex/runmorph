import { List } from "@runmorph/cdk";

import mapper, { type CalendlyEventType } from "./mapper";

interface CalendlyEventTypeListResponse {
  collection: CalendlyEventType[];
  pagination: {
    next_page_token: string | null;
    previous_page_token: string | null;
  };
}

export default new List({
  mapper,
  scopes: [],
  handler: async (connection, { limit, cursor }) => {
    const organizationId = await connection.getMetadata("organizationId");
    const { data, error } =
      await connection.proxy<CalendlyEventTypeListResponse>({
        method: "GET",
        path: "/event_types",
        query: {
          organization: `https://api.calendly.com/organizations/${organizationId}`,
          page_token: cursor || undefined,
        },
      });

    if (error) {
      return { error };
    }

    return {
      data: data.collection,
      next: data.pagination.next_page_token,
    };
  },
});
