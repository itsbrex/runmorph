import { Retrieve } from "@runmorph/cdk";

import SalesforceOrganizationMapper, {
  type SalesforceOrganization,
} from "./mapper";

export default new Retrieve({
  scopes: [],
  mapper: SalesforceOrganizationMapper,
  handler: async (connection, { id, fields }) => {
    if (id === "me") {
      const { data, error } = await connection.proxy<{
        records: SalesforceOrganization[];
      }>({
        method: "GET",
        path: `/query`,
        query: {
          q: `SELECT ${fields.join(",")} FROM Organization`,
        },
      });

      if (error) {
        return { error };
      }

      if (!data.records?.[0]) {
        return {
          error: {
            code: "CONNECTOR::OPERATION::RESOURCE_NOT_FOUND",
            message: "Organization not found",
          },
        };
      }

      return data.records[0];
    }

    const { data, error } = await connection.proxy<SalesforceOrganization>({
      method: "GET",
      path: `/sobjects/Organization/${id}`,
      query: {
        fields: fields.join(","),
      },
    });

    if (error) {
      return { error };
    }

    return data;
  },
});
