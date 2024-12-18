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
  Settings,
} from "@runmorph/cdk";
import type {
  ResourceModels,
  ResourceModelId,
  ResourceModelFieldKeys,
  ResourceModelExpandableFieldKeys,
} from "@runmorph/resource-models";

import { ConnectionClient } from "./Connection";
import { MorphClient } from "./Morph";
import { ListParams } from "./types";

export type MorphResource<RTI extends ResourceModelId> = ResourceData<
  ResourceModels[RTI]
>;
export class ResourceClient<
  C extends ConnectorBundle<
    string,
    Settings,
    Settings,
    ResourceModelOperations,
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>, string>
  >,
  CA extends ConnectorBundle<
    string,
    Settings,
    Settings,
    ResourceModelOperations,
    WebhookOperations<ResourceEvents, Record<string, ResourceEvents>, string>
  >[],
  RTI extends keyof C["resourceModelOperations"],
> {
  private morph: MorphClient<CA>;
  𝙢_: {
    connection: ConnectionClient<C, CA>;
    connector: C;
    resourceModelId: RTI;
    logger?: Logger;
  };

  constructor(
    morph: MorphClient<CA>,
    connection: ConnectionClient<C, CA>,
    entityId: RTI
  ) {
    this.morph = morph;
    const { data: ids, error } = connection.getConnectionIds();
    if (error) {
      this.morph.m_.logger?.error(
        "ResourceClient : Failed to get connection ids",
        {
          error,
        }
      );
      throw "WebhookClient : Failed to get connection ids";
    }
    this.𝙢_ = {
      logger: this.morph.m_.logger,
      connection: connection,
      connector: this.morph.m_.connectors[ids.connectorId] as C,
      resourceModelId: entityId,
    };
  }

  async list(params?: ListParams): Promise<
    EitherTypeOrError<{
      //@ts-expect-error EI expected not to be full set of EntityId
      data: ResourceData<ResourceModels[RTI]>[];
      next: string | null;
    }>
  > {
    this.𝙢_.logger?.debug("Listing resources", {
      resourceModelId: this.𝙢_.resourceModelId,
      params,
    });

    const entityRecord =
      this.𝙢_.connector.resourceModelOperations[
        this.𝙢_.resourceModelId as RTI & ResourceModelId
      ];

    if (entityRecord) {
      if (entityRecord.list) {
        const { data, next, error } = await entityRecord.list.run(
          this.𝙢_.connection,
          params
        );

        if (error) {
          this.𝙢_.logger?.error("Failed to list resources", { error });
          return { error };
        }

        this.𝙢_.logger?.debug("Resources listed successfully", {
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
        this.𝙢_.logger?.error("List operation not implemented", {
          resourceModelId: this.𝙢_.resourceModelId,
          connectorId: this.𝙢_.connector.id,
        });
        return {
          error: {
            code: "CONNECTOR::RESOURCE_MODEL::NOT_FOUND",
            message: `Entity "${String(this.𝙢_.resourceModelId)}" not implemented on the "${this.𝙢_.connector.id}" connector.`,
          },
        };
      }
    }

    this.𝙢_.logger?.error("Unknown error during list operation");
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
    this.𝙢_.logger?.debug("Retrieving resource", {
      resourceModelId: this.𝙢_.resourceModelId,
      resourceId: id,
      options,
    });

    const resourceModelRecord =
      this.𝙢_.connector.resourceModelOperations[
        this.𝙢_.resourceModelId as RTI extends ResourceModelId ? RTI : never
      ];

    if (resourceModelRecord) {
      if (resourceModelRecord.retrieve) {
        const { data, error } = await resourceModelRecord.retrieve.run(
          this.𝙢_.connection,
          id,
          options
        );

        if (error) {
          this.𝙢_.logger?.error("Failed to retrieve resource", {
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

        this.𝙢_.logger?.debug("Resource retrieved successfully", {
          resourceId: id,
        });
        return {
          data: data as ResourceData<
            ResourceModels[RTI extends ResourceModelId ? RTI : never]
          >,
        };
      }
    } else {
      this.𝙢_.logger?.error("Resource model not found", {
        resourceModelId: this.𝙢_.resourceModelId,
        connectorId: this.𝙢_.connector.id,
      });
      return {
        error: {
          code: "CONNECTOR::RESOURCE_MODEL::NOT_FOUND",
          message: `Entity "${String(this.𝙢_.resourceModelId)}" not implemented on the "${this.𝙢_.connector.id}" connector.`,
        },
      };
    }

    this.𝙢_.logger?.error("Unknown error during retrieve operation");
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
    this.𝙢_.logger?.debug("Creating resource", {
      resourceModelId: this.𝙢_.resourceModelId,
      fields,
      options,
    });

    const resourceModelRecord =
      this.𝙢_.connector.resourceModelOperations[
        this.𝙢_.resourceModelId as RTI extends ResourceModelId ? RTI : never
      ];

    if (resourceModelRecord) {
      if (resourceModelRecord.create) {
        const { data, error } = await resourceModelRecord.create.run(
          this.𝙢_.connection,
          fields
        );

        if (error) {
          this.𝙢_.logger?.error("Failed to create resource", { error });
          return { error };
        }

        if (options?.returnResource) {
          this.𝙢_.logger?.debug("Retrieving created resource", {
            resourceId: data.id,
          });
          const { data: createdResource, error: retrieveError } =
            await this.retrieve(data.id);
          if (retrieveError) {
            this.𝙢_.logger?.error("Failed to retrieve created resource", {
              error: retrieveError,
            });
            return { error: retrieveError };
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return { data: createdResource as any };
        }

        delete data.rawResource;
        this.𝙢_.logger?.info("Resource created successfully", {
          resourceId: data.id,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { data: data as any };
      } else {
        this.𝙢_.logger?.error("Create operation not implemented", {
          resourceModelId: this.𝙢_.resourceModelId,
          connectorId: this.𝙢_.connector.id,
        });
        return {
          error: {
            code: "CONNECTOR::OPERATION::NOT_FOUND",
            message: `Create operation not implemented for resource model "${String(this.𝙢_.resourceModelId)}" on the "${this.𝙢_.connector.id}" connector.`,
          },
        };
      }
    }

    this.𝙢_.logger?.error("Resource model not found", {
      resourceModelId: this.𝙢_.resourceModelId,
      connectorId: this.𝙢_.connector.id,
    });
    return {
      error: {
        code: "CONNECTOR::RESOURCE_MODEL::NOT_FOUND",
        message: `Resource model "${String(this.𝙢_.resourceModelId)}" not found on the "${this.𝙢_.connector.id}" connector.`,
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
      this.𝙢_.connector.resourceModelOperations[
        this.𝙢_.resourceModelId as RTI extends ResourceModelId ? RTI : never
      ];

    if (resourceModelRecord) {
      if (resourceModelRecord.update) {
        const { data, error } = await resourceModelRecord.update.run(
          this.𝙢_.connection,
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
            message: `Update operation not implemented for resource model "${String(this.𝙢_.resourceModelId)}" on the "${this.𝙢_.connector.id}" connector.`,
          },
        };
      }
    }

    return {
      error: {
        code: "CONNECTOR::RESOURCE_MODEL::NOT_FOUND",
        message: `Resource model "${String(this.𝙢_.resourceModelId)}" not found on the "${this.𝙢_.connector.id}" connector.`,
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
      this.𝙢_.logger?.debug("Expanding array of resource refs");
      return Promise.all(
        obj.map((o) => this._expandResourceRefs(o, expandKeys, parentKey))
      );
    } else if (typeof obj === "object" && obj !== null) {
      if (obj.object === "resourceRef" && obj.model && obj.id) {
        this.𝙢_.logger?.debug("Expanding resource ref", {
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
            this.𝙢_.logger?.debug("Using local raw resource ref");
            const mappedLocalResourceRef =
              this.𝙢_.connector.resourceModelOperations[
                obj.model as ResourceModelId
              ]?.mapper.read(obj.rawResource);

            if (mappedLocalResourceRef) {
              delete mappedLocalResourceRef.rawResource;
              return mappedLocalResourceRef;
            }
          }

          return this.𝙢_.connection
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
              this.𝙢_.logger?.error("Failed to expand resource ref", {
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
