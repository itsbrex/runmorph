import { Retrieve } from "@runmorph/cdk";

import { type XeroInvoiceItem } from "./mapper";
import mapper from "./mapper";

export default new Retrieve({
  scopes: ["accounting.settings.read"],
  mapper,
  handler: async (connection, input) => {
    const { data, error } = await connection.proxy<{
      Items: XeroInvoiceItem[];
    }>({
      method: "GET",
      path: `/api.xro/2.0/Items/${input.id}`,
    });

    if (error) {
      return { error };
    }

    const item = data.Items[0];

    if (!item) {
      return {
        error: {
          code: "CONNECTOR::OPERATION::RESOURCE_NOT_FOUND" as const,
          message: "Item not found",
        },
      };
    }

    const { data: orgData, error: orgError } = await connection.proxy<{
      Organisations: Array<{ BaseCurrency: string }>;
    }>({
      method: "GET",
      path: "/api.xro/2.0/Organisation",
    });

    if (orgError) {
      return { error: orgError };
    }

    return {
      ...item,
      _organization: {
        BaseCurrency: orgData.Organisations[0].BaseCurrency,
      },
    };
  },
});
