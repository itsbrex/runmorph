import { FieldMapper, FieldType, DeepPartial } from "@runmorph/cdk";

import defaultFields from "./default";

/**
 * Chargebee field type as returned by the Chargebee API
 */
export interface ChargebeeField {
  name: string;
  label: string;
  description?: string;
  type: "text" | "number" | "boolean" | "select";
  required: boolean;
  readOnly: boolean;
  options?: Array<{
    value: string;
    label: string;
  }>;
}

/**
 * Field mapper for Chargebee fields
 * Maps between Chargebee API field schema and unified field format
 */
export const chargebeeFieldMapper = new FieldMapper<ChargebeeField, any>({
  defaultFields,
  field: {
    // Map the unique identifier
    key: {
      read: (from) => from("name"),
      write: (to) => to("name"),
    },

    // Map the human-readable name
    name: {
      read: (from) => from("label"),
      write: (to) => to("label"),
    },

    // Map the description
    description: {
      read: (from) => from("description"),
      write: (to) => to("description"),
    },

    // Map whether the field is required
    isRequired: {
      read: (from) => from("required"),
      write: (to) => to("required"),
    },

    // Map whether the field is read-only
    isValueReadOnly: {
      read: (from) => from("readOnly"),
      write: (to) => to("readOnly"),
    },

    // Map the field type
    type: {
      read: (from) =>
        from("type", (type): FieldType => {
          switch (type) {
            case "text":
              return "text";
            case "number":
              return "number";
            case "boolean":
              return "boolean";
            case "select":
              return "select";
            default:
              return "text";
          }
        }),
      write: (to) =>
        to("type", (_, { field }): DeepPartial<ChargebeeField["type"]> => {
          switch (field.type) {
            case "text":
              return "text";
            case "number":
              return "number";
            case "boolean":
              return "boolean";
            case "select":
              return "select";
            default:
              return "text";
          }
        }),
    },

    // Map select options
    options: {
      read: (from) =>
        from(
          "options",
          (options) =>
            options?.map((opt) => ({
              value: opt.value,
              name: opt.label,
            })) || []
        ),
      write: (to) =>
        to("options", (_, { field }) =>
          field.type === "select"
            ? field.options?.map((opt) => ({
                value: opt.value,
                label: opt.name,
              }))
            : undefined
        ),
    },
  },
  value: {
    read: async ({ field }) => {
      const { key, type, value } = field;

      if (!value || !value[key]) {
        return undefined;
      }

      const fieldValue = value[key];

      switch (type) {
        case "text":
          return fieldValue;
        case "number":
          return typeof fieldValue === "string"
            ? parseFloat(fieldValue)
            : fieldValue;
        case "boolean":
          return Boolean(fieldValue);
        case "select":
          return fieldValue;
        default:
          return undefined;
      }
    },

    write: async ({ field }) => {
      const { key, type, value } = field;
      const object: Record<string, any> = {};

      switch (type) {
        case "text":
          object[key] = value;
          break;
        case "number":
          object[key] = value?.toString();
          break;
        case "boolean":
          object[key] = Boolean(value);
          break;
        case "select":
          object[key] = value;
          break;
      }

      return object;
    },
  },
});

export default chargebeeFieldMapper;
