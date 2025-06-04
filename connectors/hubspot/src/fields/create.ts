import { CreateField } from "@runmorph/cdk";

import hubspotFieldMapper, { HubSpotProperty } from "./mapper";

/**
 * Map of HubSpot object types to their API identifiers
 */
const HUBSPOT_OBJECT_TYPES: Record<string, string> = {
  genericContact: "contact",
  genericCompany: "company",
  crmOpportunity: "deal",
};

/**
 * Implementation of CreateField for HubSpot properties
 * Handles creating properties for different object types in the HubSpot API
 */
export const hubspotCreateField = new CreateField({
  // Use the HubSpot field mapper for converting between formats
  fieldMapper: hubspotFieldMapper,
  // Required scopes for creating properties
  scopes: [],
  models: {
    genericContact: {
      scopes: ["crm.schemas.contacts.write"],
    },
    genericCompany: {
      scopes: ["crm.schemas.companies.write"],
    },
    crmOpportunity: {
      scopes: ["crm.schemas.deals.write"],
    },
  },
  /**
   * Handler for creating HubSpot properties
   * Makes API calls to create a property for a specific object type
   */
  handler: async (connection, params) => {
    // Map the Morph model ID to HubSpot object type
    const objectType = HUBSPOT_OBJECT_TYPES[params.model];

    if (!objectType) {
      return {
        error: {
          code: "CONNECTOR::OPERATION::BAD_REQUEST" as const,
          message: `Unsupported model type (${params.model}) for field creation.`,
        },
      };
    }

    // Make the API request to HubSpot
    const { data, error } = await connection.proxy<HubSpotProperty>({
      path: `/crm/v3/properties/${objectType}`,
      method: "POST",
      data: {
        ...params.field,
        groupName: `${objectType}information`,
      },
    });

    // Handle error response
    if (error) {
      if (error.message.includes("409")) {
        return {
          error: {
            code: "CONNECTOR::OPERATION::FIELD_ALREADY_EXISTS" as const,
            message: `Field already exists (${params.field.name})`,
          },
        };
      }
      return {
        error,
      };
    }

    return data;
  },
});

export default hubspotCreateField;
