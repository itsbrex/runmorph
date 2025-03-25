import type {
  ConnectorBundle,
  ResourceModelOperations,
  ResourceData,
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
import { ListParams as ListOptions } from "./types";

export type MorphResource<RTI extends ResourceModelId> = ResourceData<
  ResourceModels[RTI]
>;
export class ResourceClient<
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
  private morph: MorphClient<CA>;
  m_: {
    connection: ConnectionClient<C, CA>;
    connector: C;
    resourceModelId: RTI;
    logger?: Logger;
  };

  constructor(
    morph: MorphClient<CA>,
    connection: ConnectionClient<C, CA>,
    modelId: RTI
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
      throw "ResourceClient : Failed to get connection ids";
    }
    this.m_ = {
      logger: this.morph.m_.logger,
      connection: connection,
      connector: this.morph.m_.connectors[ids.connectorId] as C,
      resourceModelId: modelId,
    };
  }

  async list(options?: ListOptions): Promise<
    EitherTypeOrError<{
      //@ts-expect-error EI expected not to be full set of EntityId
      data: ResourceData<ResourceModels[RTI]>[];
      next: string | null;
    }>
  > {
    this.m_.logger?.debug("Listing resources", {
      resourceModelId: this.m_.resourceModelId,
      params: options,
    });
    const fieldMapper = this.m_.connector.fieldOperations?.mapper;

    const entityRecord =
      this.m_.connector.resourceModelOperations[
        this.m_.resourceModelId as RTI & ResourceModelId
      ];

    if (entityRecord) {
      if (entityRecord.list) {
        const { data, next, error } = await entityRecord.list.run(
          this.m_.connection,
          options,
          fieldMapper
        );

        if (error) {
          this.m_.logger?.error("Failed to list resources", { error });
          return { error };
        }

        this.m_.logger?.debug("Resources listed successfully", {
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
        this.m_.logger?.error("List operation not implemented", {
          resourceModelId: this.m_.resourceModelId,
          connectorId: this.m_.connector.id,
        });
        return {
          error: {
            code: "CONNECTOR::RESOURCE_MODEL::NOT_FOUND",
            message: `Entity "${String(this.m_.resourceModelId)}" not implemented on the "${this.m_.connector.id}" connector.`,
          },
        };
      }
    }

    this.m_.logger?.error("Unknown error during list operation");
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
    this.m_.logger?.debug("Retrieving resource", {
      resourceModelId: this.m_.resourceModelId,
      resourceId: id,
      options,
    });

    const resourceModelRecord =
      this.m_.connector.resourceModelOperations[
        this.m_.resourceModelId as RTI extends ResourceModelId ? RTI : never
      ];

    const fieldMapper = this.m_.connector.fieldOperations?.mapper;

    if (resourceModelRecord) {
      if (resourceModelRecord.retrieve) {
        const { data, error } = await resourceModelRecord.retrieve.run(
          this.m_.connection,
          id,
          options,
          fieldMapper
        );

        if (error) {
          this.m_.logger?.error("Failed to retrieve resource", {
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

        this.m_.logger?.debug("Resource retrieved successfully", {
          resourceId: id,
          data,
        });
        return {
          data: data as ResourceData<
            ResourceModels[RTI extends ResourceModelId ? RTI : never]
          >,
        };
      }
    } else {
      this.m_.logger?.error("Resource model not found", {
        resourceModelId: this.m_.resourceModelId,
        connectorId: this.m_.connector.id,
      });
      return {
        error: {
          code: "CONNECTOR::RESOURCE_MODEL::NOT_FOUND",
          message: `Entity "${String(this.m_.resourceModelId)}" not implemented on the "${this.m_.connector.id}" connector.`,
        },
      };
    }

    this.m_.logger?.error("Unknown error during retrieve operation");
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
    this.m_.logger?.debug("Creating resource", {
      resourceModelId: this.m_.resourceModelId,
      fields,
      options,
    });

    const fieldMapper = this.m_.connector.fieldOperations?.mapper;

    const resourceModelRecord =
      this.m_.connector.resourceModelOperations[
        this.m_.resourceModelId as RTI extends ResourceModelId ? RTI : never
      ];

    if (resourceModelRecord) {
      if (resourceModelRecord.create) {
        const { data, error } = await resourceModelRecord.create.run(
          this.m_.connection,
          fields,
          fieldMapper
        );

        if (error) {
          this.m_.logger?.error("Failed to create resource", { error });
          return { error };
        }

        if (options?.returnResource) {
          this.m_.logger?.debug("Retrieving created resource", {
            resourceId: data.id,
          });
          const { data: createdResource, error: retrieveError } =
            await this.retrieve(data.id);
          if (retrieveError) {
            this.m_.logger?.error("Failed to retrieve created resource", {
              error: retrieveError,
            });
            return { error: retrieveError };
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return { data: createdResource as any };
        }

        delete data.rawResource;
        this.m_.logger?.info("Resource created successfully", {
          resourceId: data.id,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { data: data as any };
      } else {
        this.m_.logger?.error("Create operation not implemented", {
          resourceModelId: this.m_.resourceModelId,
          connectorId: this.m_.connector.id,
        });
        return {
          error: {
            code: "CONNECTOR::OPERATION::NOT_FOUND",
            message: `Create operation not implemented for resource model "${String(this.m_.resourceModelId)}" on the "${this.m_.connector.id}" connector.`,
          },
        };
      }
    }

    this.m_.logger?.error("Resource model not found", {
      resourceModelId: this.m_.resourceModelId,
      connectorId: this.m_.connector.id,
    });
    return {
      error: {
        code: "CONNECTOR::RESOURCE_MODEL::NOT_FOUND",
        message: `Resource model "${String(this.m_.resourceModelId)}" not found on the "${this.m_.connector.id}" connector.`,
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
    const fieldMapper = this.m_.connector.fieldOperations?.mapper;

    const resourceModelRecord =
      this.m_.connector.resourceModelOperations[
        this.m_.resourceModelId as RTI extends ResourceModelId ? RTI : never
      ];

    if (resourceModelRecord) {
      if (resourceModelRecord.update) {
        const { data, error } = await resourceModelRecord.update.run(
          this.m_.connection,
          id,
          fields,
          fieldMapper
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
            message: `Update operation not implemented for resource model "${String(this.m_.resourceModelId)}" on the "${this.m_.connector.id}" connector.`,
          },
        };
      }
    }

    return {
      error: {
        code: "CONNECTOR::RESOURCE_MODEL::NOT_FOUND",
        message: `Resource model "${String(this.m_.resourceModelId)}" not found on the "${this.m_.connector.id}" connector.`,
      },
    };
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  delete(id: string): Awaitable<void> {
    // Implementation
  }

  private _expandResourceRefs = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj: any,
    expandKeys: string[],
    parentKey?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> => {
    if (Array.isArray(obj)) {
      this.m_.logger?.debug("Expanding array of resource refs");
      return Promise.all(
        obj.map((o) => this._expandResourceRefs(o, expandKeys, parentKey))
      );
    } else if (typeof obj === "object" && obj !== null) {
      if (obj.object === "resourceRef" && obj.model && obj.id) {
        this.m_.logger?.debug("Expanding resource ref", {
          model: obj.model,
          id: obj.id,
          parentKey,
          expandKeys,
        });

        if (parentKey && expandKeys.includes(parentKey)) {
          const newExpandKeys = expandKeys.filter((ek) => ek !== parentKey);
          expandKeys = (newExpandKeys[0] ? newExpandKeys : ["_"]) as [
            string,
            ...string[],
          ];

          if (obj.rawResource) {
            this.m_.logger?.debug("Using local raw resource ref");
            const mappedLocalResourceRef =
              this.m_.connector.resourceModelOperations[
                obj.model as ResourceModelId
              ]?.mapper.read(obj.rawResource);

            if (mappedLocalResourceRef) {
              delete mappedLocalResourceRef.rawResource;
              return mappedLocalResourceRef;
            }
          }

          return this.m_.connection
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
              this.m_.logger?.error("Failed to expand resource ref", {
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
