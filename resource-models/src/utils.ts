import { z } from "./ZodExtensions";

function isResourceRef(unwrappedValue: any): boolean {
  return (
    unwrappedValue?._def?.innerType?._def?.typeName === "ZodEffects" &&
    unwrappedValue._def.innerType?._def?.schema?.shape?.id?._def?.typeName ===
      "ZodString"
  );
}

function generateFilterSchema(
  resourceModelSchema: z.ZodObject<any>
): z.ZodOptional<z.ZodObject<any>> {
  const filterSchemaFlatten = Object.fromEntries(
    Object.entries(resourceModelSchema.shape).map(([key, value]) => {
      // Unwrap layers until we get to the core type
      let unwrappedValue: any = value;
      let unwrapSteps: string[] = [];

      while (unwrappedValue) {
        if (unwrappedValue instanceof z.ZodOptional) {
          unwrapSteps.push("optional");
          unwrappedValue = unwrappedValue._def.innerType;
        } else if (isResourceRef(unwrappedValue)) {
          unwrapSteps.push("resource");
          return [key, z.string()];
        } else if ("description" in (unwrappedValue._def || {})) {
          unwrapSteps.push("description");
          unwrappedValue = unwrappedValue._def.innerType;
        } else {
          break;
        }
      }

      // Process array if found
      if (
        unwrappedValue?.constructor?.name === "ZodArray" ||
        unwrappedValue instanceof z.ZodArray
      ) {
        const elementType = unwrappedValue.element;
        // Check if array element is a morph resource
        if (isResourceRef(elementType)) {
          unwrapSteps.push("resource");
          return [key, z.string()];
        }
        return [key, elementType.optional()];
      }

      return [key, (unwrappedValue || value).optional()];
    })
  );

  return z.object({ ...filterSchemaFlatten }).optional();
}

export { generateFilterSchema };
