import { Retrieve } from "@runmorph/cdk";

import XeroContactMapper, { type XeroContact } from "./mapper";

export default new Retrieve({
  scopes: ["accounting.contacts.read"],
  mapper: XeroContactMapper,
  handler: async (connection, { id }) => {
    const { data, error } = await connection.proxy<{ Contacts: XeroContact[] }>(
      {
        method: "GET",
        path: `/api.xro/2.0/contacts/${id}`,
      }
    );

    if (error) {
      return { error };
    }

    return data.Contacts[0];
  },
});
