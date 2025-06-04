import { CreateField, MorphError } from "@runmorph/cdk";

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
 * Implementation of CreateField for Pipedrive fields
 * Handles creating fields for different object types in the Pipedrive API
 */
export const pipedriveCreateField = new CreateField({
  // Use the Pipedrive field mapper for converting between formats
  fieldMapper: pipedriveFieldMapper,
  // Required scopes for creating fields
  scopes: ["admin"],
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
   * Handler for creating Pipedrive fields
   * Makes API calls to create a field for a specific object type
   */
  handler: async (connection, { model, field }) => {
    // Map the Morph model ID to Pipedrive endpoint
    const endpoint = PIPEDRIVE_FIELD_ENDPOINTS[model];

    if (!endpoint) {
      return {
        error: {
          code: "CONNECTOR::OPERATION::BAD_REQUEST" as const,
          message: `Unsupported model type (${model}) for field creation.`,
        },
      };
    }

    // First, check if a field with this key already exists
    const existingFieldsResponse = await connection.proxy<{
      success: boolean;
      data: PipedriveField[];
    }>({
      path: endpoint,
      method: "GET",
    });

    if (existingFieldsResponse.error) {
      return { error: existingFieldsResponse.error };
    }

    // Check if a field with the same morph::key already exists
    const morphKey = field.description;
    const existingField = existingFieldsResponse.data.data.find(
      (f) => f.description === morphKey
    );

    if (existingField) {
      return {
        error: {
          code: "CONNECTOR::OPERATION::FIELD_ALREADY_EXISTS" as const,
          message: `A field with key '${field.description?.replace("custom_field::", "")}' already exists.`,
        },
      };
    }

    // Format field data according to Pipedrive API requirements
    const fieldData = {
      ...field,
      description: morphKey,
    };

    // Make the API request to Pipedrive
    const { data, error } = await connection.proxy<{
      success: boolean;
      data: PipedriveField;
    }>({
      path: endpoint,
      method: "POST",
      data: fieldData,
    });

    // Handle error response
    if (error) {
      return { error };
    }

    return data.data;
  },
});

export default pipedriveCreateField;
