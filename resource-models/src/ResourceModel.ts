import { z, zMoprhResource } from "./ZodExtensions";

export type ResourceModelFieldKeys<
  RT extends ResourceModel<string, Record<string, z.ZodTypeAny>>,
> = keyof z.infer<ReturnType<RT["schema"]>>;

type ResourceModelExpandableFiedCheck =
  | {
      object: "resourceRef" | "resource";
    }
  | undefined;

export type ResourceModelExpandableFieldKeys<
  RT extends ResourceModel<string, Record<string, z.ZodTypeAny>>,
> = {
  [K in keyof z.infer<ReturnType<RT["schema"]>>]: z.infer<
    ReturnType<RT["schema"]>
  >[K] extends
    | ResourceModelExpandableFiedCheck[]
    | ResourceModelExpandableFiedCheck
    | undefined
    ? K
    : never;
}[keyof z.infer<ReturnType<RT["schema"]>>];

export class ResourceModel<
  I extends string,
  RFS extends Record<string, z.ZodTypeAny>,
> {
  public id: I;
  public schema: (zInstance?: typeof z) => z.ZodObject<RFS>;

  constructor({
    id,
    schema,
  }: {
    id: I;
    schema: (
      zodInstance: typeof z & { morph: { resource: zMoprhResource } },
    ) => RFS;
  }) {
    this.id = id;
    this.schema = (zInstance?: typeof z): z.ZodObject<RFS> => {
      return z.object(
        schema({
          ...(zInstance ? zInstance : z),
          ...{ morph: { resource: zMoprhResource } },
        }),
      );
    };
  }
}

export class ResourceModelMap<
  T extends Record<string, ResourceModel<string, Record<string, z.ZodTypeAny>>>,
> {
  constructor(private resourceModelsMap: T) {}

  // Get the entire resource models record
  public getResourceModelMap(): T {
    if (!this.resourceModelsMap) {
      throw new Error("Resource models map not found");
    }
    return this.resourceModelsMap;
  }
  // Get the resource model based on its id, ensuring type safety
  public getResourceModel<K extends keyof T>(resourceModelId: K): T[K] {
    if (!this.resourceModelsMap) {
      throw new Error(`Resource models map not found`);
    }
    const resourceModel = this.resourceModelsMap[resourceModelId];
    if (!resourceModel) {
      throw new Error(`Resource model not found`);
    }
    return resourceModel;
  }

  // Get all resource model IDs
  public getResourceModelIds(): Array<keyof T> {
    if (!this.resourceModelsMap) {
      throw new Error("Resource models map not found");
    }
    return Object.keys(this.resourceModelsMap) as Array<keyof T>;
  }

  // Add a new resource model with a schema and return a new instance of ResourceModels with the updated type
  public addResourceModel<
    I extends string,
    RFS extends Record<string, z.ZodTypeAny>,
  >(
    resourceModel: ResourceModel<I, RFS>,
  ): ResourceModelMap<T & Record<I, ResourceModel<I, RFS>>> {
    console.log("resourceModel", resourceModel);
    if (!resourceModel?.id) {
      return this as unknown as ResourceModelMap<
        T & Record<I, ResourceModel<I, RFS>>
      >;
    }
    if (!this.resourceModelsMap) {
      throw new Error(`Resource models map not found`);
    }
    if (resourceModel?.id in this.resourceModelsMap) {
      throw new Error(`Resource model '${resourceModel.id}' already exists`);
    }

    // Return a new instance of ResourceModels with the updated type map
    return new ResourceModelMap({
      ...this.resourceModelsMap,
      [resourceModel.id]: resourceModel,
    });
  }
}
