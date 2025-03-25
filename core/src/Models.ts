import type {
  ConnectorBundle,
  ResourceModelOperations,
  WebhookOperations,
  ResourceEvents,
  Settings,
  EitherTypeOrError,
  UnifiedField,
} from "@runmorph/cdk";

import { ConnectionClient } from "./Connection";
import { MorphClient } from "./Morph";
import { ResourceModelId } from "@runmorph/resource-models";

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

  async listFields(options: {} = {}): Promise<
    EitherTypeOrError<{
      data: UnifiedField[];
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

    if (fieldOperations) {
      if (fieldOperations.list) {
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
        return {
          error: {
            code: "CONNECTOR::RESOURCE_MODEL::NOT_FOUND",
            message: `Entity "${String(this.m_.resourceModelId)}" not implemented on the "${this.m_.connector.id}" connector.`,
          },
        };
      }
    }

    // this.m_.logger?.error("Unknown error during list operation");
    return {
      error: {
        code: "CONNECTOR::UNKNOWN_ERROR",
        message: "Unknown error",
      },
    };
  }
  // No methods implemented yet as per requirements
}
