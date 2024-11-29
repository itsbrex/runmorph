import type {
  ConnectorBundle,
  ResourceModelOperations,
  ResourceData,
  ArrayToIndexedObject,
  EitherTypeOrError,
  Awaitable,
  EitherDataOrError,
  ResourceRefData,
  Logger,
  WebhookOperations,
  ResourceEvents,
} from "@runmorph/cdk";
import type {
  ResourceModels,
  ResourceModelId,
  ResourceModelFieldKeys,
  ResourceModelExpandableFieldKeys,
} from "@runmorph/resource-models";

import { ConnectionClient } from "./Connection";
import { ListParams, Adapter } from "./types";

export type MorphResource<RTI extends ResourceModelId> = ResourceData<
  ResourceModels[RTI]
>;
export class ResourceClient<
  A extends Adapter,
  C extends ConnectorBundle<
    string,
    ResourceModelOperations,
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>>
  >[],
  CI extends C[number]["id"],
  RTI extends keyof ArrayToIndexedObject<
    C,
    "id"
  >[CI]["resourceModelOperations"],
> {
  connection: ConnectionClient<A, C, CI>;
  connector: ArrayToIndexedObject<C, "id">[CI];
  resourceModelId: RTI;
  logger?: Logger;
  constructor(connection: ConnectionClient<A, C, CI>, entityId: RTI) {
    this.logger = connection.logger;
    this.connection = connection;
    this.connector =
      connection.config.morph.𝙢_.connectors[connection.connectorId];
    this.resourceModelId = entityId;
  } // eslint-disable-line @typescript-eslint/no-unused-vars

  async list(params?: ListParams): Promise<
    EitherTypeOrError<{
      //@ts-expect-error EI expected not to be full set of EntityId
      data: ResourceData<ResourceModels[RTI]>[];
      next: string | null;
    }>
  > {
    this.logger?.debug("Listing resources", {
      resourceModelId: this.resourceModelId,
      params,
    });

    const entityRecord =
      this.connector.resourceModelOperations[
        this.resourceModelId as RTI & ResourceModelId
      ];

    if (entityRecord) {
      if (entityRecord.list) {
        const { data, next, error } = await entityRecord.list.run(
          this.connection,
          params
        );

        if (error) {
          this.logger?.error("Failed to list resources", { error });
          return { error };
        }

        this.logger?.debug("Resources listed successfully", {
          count: data.length,
          hasMore: !!next,
        });

        return {
          data: data.map((d) => {
            delete d.rawResource;
            return d;
          }) as ResourceData<
            ResourceModels[RTI extends ResourceModelId ? RTI : never]
          >[],
          next,
        };
      } else {
        this.logger?.error("List operation not implemented", {
          resourceModelId: this.resourceModelId,
          connectorId: this.connector.id,
        });
        return {
          error: {
            code: "CONNECTOR::RESOURCE_MODEL::NOT_FOUND",
            message: `Entity "${String(this.resourceModelId)}" not implemented on the "${this.connector.id}" connector.`,
          },
        };
      }
    }

    this.logger?.error("Unknown error during list operation");
    return {
      error: {
        code: "CONNECTOR::UNKNOWN_ERROR",
        message: "Unknown error",
      },
    };
  }

  async retrieve(
    id: string,
    options?: {
      fields?: [
        ResourceModelFieldKeys<
          ResourceModels[RTI extends ResourceModelId ? RTI : never]
        >,
        ...ResourceModelFieldKeys<
          ResourceModels[RTI extends ResourceModelId ? RTI : never]
        >[],
      ];
      expand?: [
        ResourceModelExpandableFieldKeys<
          ResourceModels[RTI extends ResourceModelId ? RTI : never]
        >,
        ...ResourceModelExpandableFieldKeys<
          ResourceModels[RTI extends ResourceModelId ? RTI : never]
        >[],
      ];
    }
  ): Promise<
    EitherDataOrError<
      ResourceData<ResourceModels[RTI extends ResourceModelId ? RTI : never]>
    >
  > {
    this.logger?.debug("Retrieving resource", {
      resourceModelId: this.resourceModelId,
      resourceId: id,
      options,
    });

    const resourceModelRecord =
      this.connector.resourceModelOperations[
        this.resourceModelId as RTI extends ResourceModelId ? RTI : never
      ];

    if (resourceModelRecord) {
      if (resourceModelRecord.retrieve) {
        const { data, error } = await resourceModelRecord.retrieve.run(
          this.connection,
          id,
          options
        );

        if (error) {
          this.logger?.error("Failed to retrieve resource", {
            error,
            resourceId: id,
          });
          return { error };
        }

        data.fields = await this._expandResourceRefs(
          data.fields,
          (options?.expand || []) as string[]
        );
        delete data.rawResource;

        this.logger?.debug("Resource retrieved successfully", {
          resourceId: id,
        });
        return {
          data: data as ResourceData<
            ResourceModels[RTI extends ResourceModelId ? RTI : never]
          >,
        };
      }
    } else {
      this.logger?.error("Resource model not found", {
        resourceModelId: this.resourceModelId,
        connectorId: this.connector.id,
      });
      return {
        error: {
          code: "CONNECTOR::RESOURCE_MODEL::NOT_FOUND",
          message: `Entity "${String(this.resourceModelId)}" not implemented on the "${this.connector.id}" connector.`,
        },
      };
    }

    this.logger?.error("Unknown error during retrieve operation");
    return {
      error: {
        code: "CONNECTOR::UNKNOWN_ERROR",
        message: "Unknown error",
      },
    };
  }

  async create<T extends boolean | undefined = false>(
    fields: ResourceData<
      ResourceModels[RTI extends ResourceModelId ? RTI : never]
    >["fields"],
    options?: { returnResource?: T }
  ): Promise<
    EitherDataOrError<
      T extends true
        ? ResourceData<
            ResourceModels[RTI extends ResourceModelId ? RTI : never]
          >
        : ResourceRefData<
            ResourceModels[RTI extends ResourceModelId ? RTI : never]
          >
    >
  > {
    this.logger?.debug("Creating resource", {
      resourceModelId: this.resourceModelId,
      fields,
      options,
    });

    const resourceModelRecord =
      this.connector.resourceModelOperations[
        this.resourceModelId as RTI extends ResourceModelId ? RTI : never
      ];

    if (resourceModelRecord) {
      if (resourceModelRecord.create) {
        const { data, error } = await resourceModelRecord.create.run(
          this.connection,
          fields
        );

        if (error) {
          this.logger?.error("Failed to create resource", { error });
          return { error };
        }

        if (options?.returnResource) {
          this.logger?.debug("Retrieving created resource", {
            resourceId: data.id,
          });
          const { data: createdResource, error: retrieveError } =
            await this.retrieve(data.id);
          if (retrieveError) {
            this.logger?.error("Failed to retrieve created resource", {
              error: retrieveError,
            });
            return { error: retrieveError };
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return { data: createdResource as any };
        }

        delete data.rawResource;
        this.logger?.info("Resource created successfully", {
          resourceId: data.id,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { data: data as any };
      } else {
        this.logger?.error("Create operation not implemented", {
          resourceModelId: this.resourceModelId,
          connectorId: this.connector.id,
        });
        return {
          error: {
            code: "CONNECTOR::OPERATION::NOT_FOUND",
            message: `Create operation not implemented for resource model "${String(this.resourceModelId)}" on the "${this.connector.id}" connector.`,
          },
        };
      }
    }

    this.logger?.error("Resource model not found", {
      resourceModelId: this.resourceModelId,
      connectorId: this.connector.id,
    });
    return {
      error: {
        code: "CONNECTOR::RESOURCE_MODEL::NOT_FOUND",
        message: `Resource model "${String(this.resourceModelId)}" not found on the "${this.connector.id}" connector.`,
      },
    };
  }

  async update<T extends boolean | undefined = false>(
    id: string,
    fields: Partial<
      ResourceData<
        ResourceModels[RTI extends ResourceModelId ? RTI : never]
      >["fields"]
    >,
    options?: { returnResource?: T }
  ): Promise<
    EitherDataOrError<
      T extends true
        ? ResourceData<
            ResourceModels[RTI extends ResourceModelId ? RTI : never]
          >
        : ResourceRefData<
            ResourceModels[RTI extends ResourceModelId ? RTI : never]
          >
    >
  > {
    const resourceModelRecord =
      this.connector.resourceModelOperations[
        this.resourceModelId as RTI extends ResourceModelId ? RTI : never
      ];

    if (resourceModelRecord) {
      if (resourceModelRecord.update) {
        const { data, error } = await resourceModelRecord.update.run(
          this.connection,
          id,
          fields
        );

        if (error) {
          return { error };
        }

        if (options?.returnResource) {
          const { data: updatedResource, error: retrieveError } =
            await this.retrieve(data.id);
          if (retrieveError) {
            return { error: retrieveError };
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return { data: updatedResource as any };
        }

        delete data.rawResource;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { data: data as any };
      } else {
        return {
          error: {
            code: "CONNECTOR::OPERATION::NOT_FOUND",
            message: `Update operation not implemented for resource model "${String(this.resourceModelId)}" on the "${this.connector.id}" connector.`,
          },
        };
      }
    }

    return {
      error: {
        code: "CONNECTOR::RESOURCE_MODEL::NOT_FOUND",
        message: `Resource model "${String(this.resourceModelId)}" not found on the "${this.connector.id}" connector.`,
      },
    };
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  delete(id: string): Awaitable<void> {
    // Implementation
  }

  private _expandResourceRefs = async (
    obj: any,
    expandKeys: string[],
    parentKey?: string
  ): Promise<any> => {
    if (Array.isArray(obj)) {
      this.logger?.debug("Expanding array of resource refs");
      return Promise.all(
        obj.map((o) => this._expandResourceRefs(o, expandKeys, parentKey))
      );
    } else if (typeof obj === "object" && obj !== null) {
      if (obj.object === "resourceRef" && obj.model && obj.id) {
        this.logger?.debug("Expanding resource ref", {
          model: obj.model,
          id: obj.id,
          parentKey,
        });

        if (parentKey && expandKeys.includes(parentKey)) {
          const newExpandKeys = expandKeys.filter((ek) => ek !== parentKey);
          expandKeys = (newExpandKeys[0] ? newExpandKeys : ["_"]) as [
            string,
            ...string[],
          ];

          if (obj.rawResource) {
            this.logger?.debug("Using local raw resource ref");
            const mappedLocalResourceRef =
              this.connector.resourceModelOperations[
                obj.model as ResourceModelId
              ]?.mapper.read(obj.rawResource);

            if (mappedLocalResourceRef) {
              delete mappedLocalResourceRef.rawResource;
              return mappedLocalResourceRef;
            }
          }

          return this.connection
            .resources(obj.model)
            .retrieve(obj.id)
            .then(({ data: refData }) => {
              if (refData && refData.object === "resource") {
                delete refData.rawResource;
                return refData;
              }
              return obj;
            })
            .catch((error) => {
              this.logger?.error("Failed to expand resource ref", {
                error,
                model: obj.model,
                id: obj.id,
              });
              return obj;
            });
        }
        delete obj.rawResource;
        return obj;
      }

      const entries = Object.entries(obj);
      const processedEntries = await Promise.all(
        entries.map(async ([key, value]) => [
          key,
          await this._expandResourceRefs(value, expandKeys, key),
        ])
      );

      return Object.fromEntries(processedEntries);
    }

    return obj;
  };
}

//const { data, error } = await new Resource("ee").retrieve("ooo");
