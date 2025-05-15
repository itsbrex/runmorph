import { Retrieve } from "@runmorph/cdk";

import XeroInvoiceMapper, { type XeroInvoice } from "./mapper";

export default new Retrieve({
  scopes: ["accounting.transactions.read"],
  mapper: XeroInvoiceMapper,
  handler: async (connection, { id }) => {
    const { data, error } = await connection.proxy<{ Invoices: XeroInvoice[] }>(
      {
        method: "GET",
        path: `/api.xro/2.0/invoices/${id}`,
      }
    );

    if (error) {
      return { error };
    }

    return data.Invoices[0];
  },
});
