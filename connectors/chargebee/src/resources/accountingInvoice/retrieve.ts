import { Retrieve } from "@runmorph/cdk";

import ChargebeeInvoiceMapper, { type ChargebeeInvoice } from "./mapper";

export default new Retrieve({
  scopes: [],
  mapper: ChargebeeInvoiceMapper,
  handler: async (connection, { id }) => {
    const { data, error } = await connection.proxy<{
      invoice: ChargebeeInvoice;
    }>({
      method: "GET",
      path: `/v2/invoices/${id}`,
    });

    if (error) {
      return { error };
    }

    return data.invoice;
  },
});
