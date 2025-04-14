import { ListField, EitherTypeOrError } from "@runmorph/cdk";
import { ResourceModelId } from "@runmorph/resource-models";

import attioFieldMapper, { AttioAttribute } from "./mapper";

/**
 * Map of Morph model IDs to Attio object types
 */
const ATTIO_OBJECT_TYPES: Record<string, string> = {
  genericContact: "people",
  genericCompany: "companies",
  crmOpportunity: "deals",
};

/**
 * Implementation of ListField for Attio attributes
 * Handles listing attributes for different object types in the Attio API
 */
export const attioListField = new ListField({
  // Use the Attio field mapper for converting between formats
  fieldMapper: attioFieldMapper,
  // Required scopes for accessing attributes
  scopes: ["object_configuration:read"],
  models: {
    genericContact: {
      scopes: [],
    },
    genericCompany: {
      scopes: [],
    },
    crmOpportunity: {
      scopes: [],
    },
  },
  /**
   * Handler for listing Attio attributes
   * Makes API calls to fetch attributes for a specific object type
   */
  handler: async (connection, { model, limit, cursor, filters }) => {
    // Map the Morph model ID to Attio object type
    const objectType = ATTIO_OBJECT_TYPES[model];

    if (!objectType) {
      return {
        error: {
          code: "CONNECTOR::OPERATION::RESOURCE_NOT_FOUND",
          message: `Unsupported model type (${model}) for field listing.`,
        },
      };
    }
    // Parse cursor if exists
    const offset = cursor ? parseInt(cursor) : 0;

    // Make the API request to Attio
    const response = await connection.proxy<{
      data: AttioAttribute[];
      pagination?: {
        total_count: number;
      };
    }>({
      path: `/v2/objects/${objectType}/attributes`,
      method: "GET",
      query: {
        limit,
        offset,
        show_archived: false, // Don't show archived attributes by default
      },
    });

    // Handle error response
    if (!response.data) {
      return {
        error: {
          code: "CONNECTOR::UNKNOWN_ERROR",
          message: `Failed to fetch attributes for ${objectType}`,
        },
      };
    }

    // Extract the attributes
    const attributes = response.data.data || [];
    const totalCount = response.data.pagination?.total_count || 0;

    // For each select attribute, fetch its options
    const attributesWithOptions = await Promise.all(
      attributes.map(async (attribute) => {
        if (attribute.type === "select") {
          // Fetch options for select attributes
          const optionsResponse = await connection.proxy<{
            data: Array<{
              id: {
                workspace_id: string;
                object_id: string;
                attribute_id: string;
                option_id: string;
              };
              title: string;
            }>;
          }>({
            path: `/v2/objects/${objectType}/attributes/${attribute.id.attribute_id}/options`,
            method: "GET",
          });

          if (optionsResponse.data?.data) {
            return {
              ...attribute,
              _options: optionsResponse.data.data.map((option) => ({
                value: option.id.option_id,
                name: option.title,
              })),
            };
          }
        }
        return attribute;
      })
    );

    // Calculate next cursor
    const nextOffset = offset + limit;
    const hasMore = nextOffset < totalCount;

    return {
      data: attributesWithOptions,
      next: hasMore ? nextOffset.toString() : null,
    };
  },
});

export default attioListField;
