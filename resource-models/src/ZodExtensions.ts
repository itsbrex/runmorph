import { z, ZodObject, ZodString, ZodOptional, ZodAny } from "zod";

import { ResourceModel } from "./ResourceModel";

// 1. Créer un symbole pour stocker les métadonnées
const resourceModelSymbol = Symbol("resourceModel");

// 2. Étendre ZodObject uniquement pour ajouter myMetadata et getMetadata
declare module "zod" {
  interface ZodObject<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    T extends z.ZodRawShape,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    UnknownKeys extends z.UnknownKeysParam = z.UnknownKeysParam,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Catchall extends z.ZodTypeAny = z.ZodTypeAny,
  > {
    // Méthode pour ajouter des métadonnées
    asMorphResource: (
      resourceModel: ResourceModel<
        string,
        Record<string, z.ZodTypeAny>,
        Record<string, z.ZodTypeAny>
      >
    ) => this;
    // Méthode pour récupérer les métadonnées
    isMorphResource: () =>
      | ResourceModel<
          string,
          Record<string, z.ZodTypeAny>,
          Record<string, z.ZodTypeAny>
        >
      | undefined;
  }
}

// 3. Implémenter l'extension de la méthode dans le prototype de ZodObject
function extendZodWithMorph(zodInstance: typeof z): void {
  zodInstance.ZodObject.prototype.asMorphResource = function (
    resourceModel: ResourceModel<
      string,
      Record<string, z.ZodTypeAny>,
      Record<string, z.ZodTypeAny>
    >
  ) {
    // Conversion via unknown, puis en Record<symbol, any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const self = this as unknown as Record<symbol, any>;

    // Si des métadonnées existent déjà, on les fusionne avec les nouvelles
    self[resourceModelSymbol] = resourceModel;

    return this; // Retourner "this" pour permettre le chaînage
  };

  zodInstance.ZodObject.prototype.isMorphResource = function () {
    // Conversion via unknown, puis accès aux métadonnées via le symbole
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const self = this as unknown as Record<symbol, any>;
    return self[resourceModelSymbol];
  };
}

// 4. Appeler la fonction pour étendre ZodObject avec nos méthodes
extendZodWithMorph(z);

export { z, extendZodWithMorph };

function zMoprhResource<
  RM extends ResourceModel<
    string,
    Record<string, z.ZodTypeAny>,
    Record<string, z.ZodTypeAny>
  >,
>(
  resourceModelId: RM["id"]
): z.ZodEffects<
  ZodObject<{ id: ZodString; rawResource: ZodOptional<ZodAny> }>,
  {
    object: "resourceRef" | "resource";
    model: string;
    id: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rawResource?: any;
  }
> {
  return z
    .object({
      id: z.string(),
      object: z.enum(["resourceRef", "resource"]).optional(),
      model: z.string().optional(),
      fields: z.any().optional(),
      rawResource: z.any().optional(),
      remote: z.object({ id: z.string().optional() }).optional(),
      createdAt: z.string().optional(),
      updatedAt: z.string().optional(),
    })
    .transform((data) => {
      if (data.object === "resource") {
        return {
          object: "resource",
          model: resourceModelId,
          ...data,
        };
      }
      return {
        object: "resourceRef",
        model: resourceModelId,
        id: data.id,
        ...(data.remote ? { remote: data.remote } : {}),
        rawResource: data.rawResource || undefined,
      };
    });
}
type zMoprhResource = typeof zMoprhResource;
export { zMoprhResource };
