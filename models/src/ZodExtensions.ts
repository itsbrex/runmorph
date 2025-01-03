import { z, ZodObject, ZodString, ZodOptional, ZodAny } from "zod";

import { Model } from "./Model";

// 1. Créer un symbole pour stocker les métadonnées
const modelSymbol = Symbol("resourceModel");

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
      resourceModel: Model<string, Record<string, z.ZodTypeAny>>
    ) => this;
    // Méthode pour récupérer les métadonnées
    isMorphResource: () =>
      | Model<string, Record<string, z.ZodTypeAny>>
      | undefined;
  }
}

// 3. Implémenter l'extension de la méthode dans le prototype de ZodObject
function extendZodWithMorph(zodInstance: typeof z): void {
  zodInstance.ZodObject.prototype.asMorphResource = function (
    model: Model<string, Record<string, z.ZodTypeAny>>
  ) {
    // Conversion via unknown, puis en Record<symbol, any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const self = this as unknown as Record<symbol, any>;

    // Si des métadonnées existent déjà, on les fusionne avec les nouvelles
    self[modelSymbol] = model;

    return this; // Retourner "this" pour permettre le chaînage
  };

  zodInstance.ZodObject.prototype.isMorphResource = function () {
    // Conversion via unknown, puis accès aux métadonnées via le symbole
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const self = this as unknown as Record<symbol, any>;
    return self[modelSymbol];
  };
}

// 4. Appeler la fonction pour étendre ZodObject avec nos méthodes
extendZodWithMorph(z);

export { z, extendZodWithMorph };

function zMoprhResource<RM extends Model<string, Record<string, z.ZodTypeAny>>>(
  modelId: RM["id"]
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
      createdAt: z.string().optional(),
      updatedAt: z.string().optional(),
    })
    .transform((data) => {
      if (data.object === "resource") {
        return {
          object: "resource",
          model: modelId,
          ...data,
        };
      }
      return {
        object: "resourceRef",
        model: modelId,
        id: data.id,
        rawResource: data.rawResource || undefined,
      };
    });
}
type zMoprhResource = typeof zMoprhResource;
export { zMoprhResource };
