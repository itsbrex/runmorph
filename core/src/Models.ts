import type {
  ConnectorBundle,
  ResourceModelOperations,
  WebhookOperations,
  ResourceEvents,
  Settings,
  EitherTypeOrError,
  UnifiedField,
  FieldType,
  FieldFilters,
  FieldTypeFormat,
  FieldTypeUnit,
  FieldOptionType,
  FieldOption,
  EitherDataOrError,
} from "@runmorph/cdk";
import { ResourceModelId } from "@runmorph/resource-models";

import { ConnectionClient } from "./Connection";
import { MorphClient } from "./Morph";

/**
 * `ModelClient` provides an interface for interacting with models in connectors.
 * It allows for retrieving model metadata, fields, and other model-specific operations.
 *
 * @template C - The connector bundle type
 * @template CA - The array of connector bundles
 * @template RTI - The resource model ID type
 */
export class ModelClient<
  C extends ConnectorBundle<
    string,
    Settings,
    Settings,
    string,
    ResourceModelOperations,
    WebhookOperations<
      ResourceEvents,
      Record<string, ResourceEvents>,
      string,
      string
    >
  >,
  CA extends ConnectorBundle<
    string,
    Settings,
    Settings,
    string,
    ResourceModelOperations,
    WebhookOperations<
      ResourceEvents,
      Record<string, ResourceEvents>,
      string,
      string
    >
  >[],
  RTI extends keyof C["resourceModelOperations"],
> {
  /** The MorphClient instance */
  private morph: MorphClient<CA>;

  m_: {
    connection: ConnectionClient<C, CA>;
    connector: C;
    resourceModelId: RTI;
  };

  /**
   * Creates a new instance of ModelClient
   *
   * @param morph - The MorphClient instance
   * @param connection - The ConnectionClient instance
   * @param modelId - The resource model ID
   */
  constructor(
    morph: MorphClient<CA>,
    connection: ConnectionClient<C, CA>,
    modelId: RTI
  ) {
    this.morph = morph;
    const { data: ids, error } = connection.getConnectionIds();
    if (error) {
      this.morph.m_.logger?.error(
        "ModelClient : Failed to get connection ids",
        {
          error,
        }
      );
      throw "ModelClient : Failed to get connection ids";
    }
    this.m_ = {
      connection: connection,
      connector: this.morph.m_.connectors[ids.connectorId] as C,
      resourceModelId: modelId,
    };
  }

  async listFields(
    options: {
      limit?: number;
      cursor?: string;
      filters?: FieldFilters;
    } = {}
  ): Promise<
    EitherTypeOrError<{
      data: UnifiedField<FieldType, string>[];
      next: string | null;
    }>
  > {
    const fieldOperations = this.m_.connector.fieldOperations;

    if (!fieldOperations) {
      this.morph.m_.logger?.error("Field operations not implemented", {
        connectorId: this.m_.connector.id,
      });
      return {
        error: {
          code: "CONNECTOR::OPERATION::NOT_FOUND",
          message: `Field operations not implemented on the "${this.m_.connector.id}" connector.`,
        },
      };
    }

    if (fieldOperations?.list) {
      const { data, next, error } = await fieldOperations.list.run(
        this.m_.connection,
        { model: this.m_.resourceModelId, ...options }
      );

      if (error) {
        //  this.m_.logger?.error("Failed to list resources", { error });
        return { error };
      }

      /* this.m_.logger?.debug("Resources listed successfully", {
        count: data.length,
        hasMore: !!next,
      });*/

      return {
        data,
        next,
      };
    } else {
      /*  this.m_.logger?.error("List operation not implemented", {
        resourceModelId: this.m_.resourceModelId,
        connectorId: this.m_.connector.id,
      });*/

      if (fieldOperations.mapper) {
        const defaultFields =
          fieldOperations.mapper.config.defaultFields?.listFields({
            modelId: this.m_.resourceModelId,
          });

        if (defaultFields) {
          // Apply filters to default fields if provided
          if (options?.filters) {
            defaultFields.data = defaultFields.data.filter((field) => {
              // Check each filter condition
              for (const [key, value] of Object.entries(
                options.filters || {}
              )) {
                // Handle special case for isCustom which is always false for default fields
                if (key === "isCustom") {
                  if (value === true) return false;
                  continue;
                }

                // Skip if field doesn't have the property being filtered
                if (!(key in field)) continue;

                // Check if field value matches filter value
                if ((field as any)[key] !== value) return false;
              }
              return true;
            });
          }
          return defaultFields;
        }
      }

      return {
        error: {
          code: "CONNECTOR::RESOURCE_MODEL::NOT_FOUND",
          message: `Field list operation on "${String(this.m_.resourceModelId)}" not implemented on the "${this.m_.connector.id}" connector.`,
        },
      };
    }
  }

  /**
   * Creates a new field in the model
   * @param field - The field to create, containing only the essential properties
   * @returns A promise that resolves to either the created field or an error
   */
  async createField(
    field: Omit<
      Partial<UnifiedField<FieldType, string>>,
      "isCustom" | "isFieldReadOnly" | "isValueReadOnly" | "isRequired"
    >
  ): Promise<EitherDataOrError<UnifiedField<FieldType, string>>> {
    const fieldOperations = this.m_.connector.fieldOperations;

    if (!fieldOperations) {
      this.morph.m_.logger?.error("Field operations not implemented", {
        connectorId: this.m_.connector.id,
      });
      return {
        error: {
          code: "CONNECTOR::OPERATION::NOT_FOUND",
          message: `Field operations not implemented on the "${this.m_.connector.id}" connector.`,
        },
      };
    }

    if (fieldOperations.create) {
      const result = await fieldOperations.create.run(this.m_.connection, {
        model: this.m_.resourceModelId,
        field,
      });

      if (result.error) {
        return { error: result.error };
      }

      return result;
    }

    return {
      error: {
        code: "CONNECTOR::RESOURCE_MODEL::NOT_FOUND",
        message: `Field create operation on "${String(this.m_.resourceModelId)}" not implemented on the "${this.m_.connector.id}" connector.`,
      },
    };
  }
}
