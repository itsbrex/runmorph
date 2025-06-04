import { ListField, EitherTypeOrError } from "@runmorph/cdk";
import { ResourceModelId } from "@runmorph/resource-models";

import pipedriveFieldMapper, { PipedriveField } from "./mapper";

/**
 * Map of Pipedrive object types to their API endpoints
 */
const PIPEDRIVE_FIELD_ENDPOINTS: Record<string, string> = {
  genericContact: "/v1/personFields",
  genericCompany: "/v1/organizationFields",
  crmOpportunity: "/v1/dealFields",
};

/**
 * Implementation of ListField for Pipedrive fields
 * Handles listing fields for different object types in the Pipedrive API
 */
export const pipedriveListField = new ListField({
  // Use the Pipedrive field mapper for converting between formats
  fieldMapper: pipedriveFieldMapper,
  // Required scopes for accessing fields
  scopes: [],
  models: {
    genericContact: {
      scopes: ["persons:read"],
    },
    genericCompany: {
      scopes: ["organizations:read"],
    },
    crmOpportunity: {
      scopes: ["deals:read"],
    },
  },
  /**
   * Handler for listing Pipedrive fields
   * Makes API calls to fetch fields for a specific object type
   */
  handler: async (connection, { model, limit, cursor, filters }) => {
    // Map the Morph model ID to Pipedrive endpoint
    const endpoint = PIPEDRIVE_FIELD_ENDPOINTS[model];

    if (!endpoint) {
      return {
        error: {
          code: "CONNECTOR::OPERATION::BAD_REQUEST",
          message: `Unsupported model type (${model}) for field listing.`,
        },
      };
    }

    // Make the API request to Pipedrive
    const response = await connection.proxy<{
      success: boolean;
      data: PipedriveField[];
      additional_data?: {
        pagination: {
          start: number;
          limit: number;
          more_items_in_collection: boolean;
        };
      };
    }>({
      path: endpoint,
      method: "GET",
    });

    // Handle error response
    if (!response.data || !response.data.success) {
      return {
        error: {
          code: "CONNECTOR::UNKNOWN_ERROR",
          message: `Failed to fetch fields for ${model}`,
        },
      };
    }

    // Extract the fields
    const fields = response.data.data || [];

    // Pipedrive doesn't support cursor-based pagination for fields
    return {
      data: fields,
      next: null,
    };
  },
});

export default pipedriveListField;
