import { ListField, EitherTypeOrError } from "@runmorph/cdk";
import { ResourceModelId } from "@runmorph/resource-models";

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
 * Implementation of ListField for HubSpot properties
 * Handles listing properties for different object types in the HubSpot API
 */
export const hubspotListField = new ListField({
  // Use the HubSpot field mapper for converting between formats
  fieldMapper: hubspotFieldMapper,
  // Required scopes for accessing properties
  scopes: [],
  models: {
    genericContact: {
      scopes: ["crm.schemas.contacts.read"],
    },
    genericCompany: {
      scopes: ["crm.schemas.companies.read"],
    },
    crmOpportunity: {
      scopes: ["crm.schemas.deals.read"],
    },
  },
  /**
   * Handler for listing HubSpot properties
   * Makes API calls to fetch properties for a specific object type
   */
  handler: async (connection, { model, limit, cursor, filters }) => {
    // Map the Morph model ID to HubSpot object type
    const objectType = HUBSPOT_OBJECT_TYPES[model];

    if (!objectType) {
      return {
        error: {
          code: "CONNECTOR::OPERATION::BAD_REQUEST",
          message: `Unsupported model type (${model}) for field listing.`,
        },
      };
    }

    // Make the API request to HubSpot
    const response = await connection.proxy<{
      results: HubSpotProperty[];
      paging?: {
        next?: {
          after: string;
        };
      };
    }>({
      path: `/crm/v3/properties/${objectType}`,
      method: "GET",
    });

    // Handle error response
    if (!response.data) {
      return {
        error: {
          code: "CONNECTOR::UNKNOWN_ERROR", // Using a standard error code
          message: `Failed to fetch fields for ${objectType}`,
        },
      };
    }

    // Extract the properties and pagination information
    const properties = response.data.results || [];
    const nextCursor = response.data.paging?.next?.after || null;

    return {
      data: properties,
      next: nextCursor,
    };
  },
});

export default hubspotListField;
