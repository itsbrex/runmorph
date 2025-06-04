import {
  FieldMapper,
  FieldType,
  FieldTypeFormat,
  FieldOption,
  FieldOptionType,
  UnifiedField,
  DeepPartial,
} from "@runmorph/cdk";

import pipedriveDefaultFields from "./default";

/**
 * Pipedrive field type as returned by the Pipedrive API
 */
export interface PipedriveField {
  id: number;
  key: string;
  name: string;
  order_nr: number;
  field_type:
    | "varchar"
    | "varchar_auto"
    | "text"
    | "date"
    | "time"
    | "timerange"
    | "daterange"
    | "enum"
    | "phone"
    | "double"
    | "monetary"
    | "user"
    | "org"
    | "people"
    | "set"
    | "address"
    | "visible_to";
  add_time: string;
  update_time: string;
  last_updated_by_user_id: number;
  created_by_user_id: number;
  active_flag: boolean;
  edit_flag: boolean;
  index_visible_flag: boolean;
  details_visible_flag: boolean;
  add_visible_flag: boolean;
  important_flag: boolean;
  bulk_edit_allowed: boolean;
  searchable_flag: boolean;
  filtering_allowed: boolean;
  sortable_flag: boolean;
  mandatory_flag: boolean | Record<string, string>;
  options?: PipedriveFieldOption[];
  description?: string;
}

/**
 * Pipedrive field option as returned by the Pipedrive API
 */
export interface PipedriveFieldOption {
  id: number;
  label: string;
}

/**
 * Pipedrive field value as returned within objects
 */
export type PipedriveFieldValue = string | number | boolean | null;

export type PipedriveFieldMetadataKey = "custom_key";

/**
 * Field mapper for Pipedrive fields
 * Maps between Pipedrive API field schema and unified field format
 */
export const pipedriveFieldMapper = new FieldMapper<
  PipedriveField,
  Record<string, PipedriveFieldValue>,
  PipedriveFieldMetadataKey
>({
  defaultFields: pipedriveDefaultFields,
  field: {
    // Map the unique identifier
    key: {
      read: (from) =>
        from("*", (field) =>
          field.description?.startsWith("custom_field::")
            ? field.description.replace("custom_field::", "")
            : field.key
        ),
      write: (to) =>
        to("description", (_, { field }) => {
          return `custom_field::${field.key}`;
        }),
    },

    metadata: {
      read: (from) =>
        from("*", (field) => {
          if (field.key) {
            return { custom_key: field.key };
          }
          return {};
        }),
    },

    // Map the human-readable name
    name: {
      read: (from) => from("name"),
      write: (to) => to("name"),
    },

    // Map whether the field is required
    isRequired: {
      read: (from) =>
        from("mandatory_flag", (mandatoryFlag) =>
          typeof mandatoryFlag === "boolean" ? mandatoryFlag : false
        ),
      write: (to) =>
        to("mandatory_flag", (isRequired) => (isRequired ? true : false)),
    },

    // Map whether the field is read-only
    isFieldReadOnly: {
      read: (from) => from("edit_flag", (editFlag) => !editFlag),
    },

    isValueReadOnly: {
      read: (from) =>
        from("add_visible_flag", (addVisibleFlag) => !addVisibleFlag),
    },

    // Map whether the field is custom
    isCustom: {
      read: (from) =>
        from(
          "created_by_user_id",
          (createdByUserId) => createdByUserId !== null
        ),
    },

    // Map the field type
    type: {
      read: (from) =>
        from("field_type", (fieldType): FieldType => {
          switch (fieldType) {
            case "varchar":
            case "varchar_auto":
            case "text":
            case "phone":
            case "address":
              return "text";
            case "double":
            case "monetary":
              return "number";
            case "date":
            case "time":
            case "timerange":
            case "daterange":
              return "datetime";
            case "enum":
              return "select";
            case "set":
              return "list.select";
            default:
              return "text";
          }
        }),
      write: (to) =>
        to("field_type", (_, { field }) => {
          switch (field.type) {
            case "text":
              return "varchar" as const;
            case "number":
              return "double" as const;
            case "datetime":
              return "date" as const;
            case "select":
              return "enum" as const;
            case "list.select":
              return "set" as const;
            default:
              return "varchar" as const;
          }
        }),
    },

    // Map the field format
    format: {
      read: (from) =>
        from("field_type", (fieldType): FieldTypeFormat<any> | undefined => {
          switch (fieldType) {
            case "phone":
              return "phone";
            case "monetary":
              return "currency";
            case "double":
              return "float";
            case "date":
              return "date";
            case "time":
            case "timerange":
            case "daterange":
              return "timestamp";
            default:
              return undefined;
          }
        }),
      write: (to) =>
        to("*", (_, { field }) => {
          if (field.type === "number" && field.format) {
            if (field.format === "currency") {
              return { field_type: "monetary" as const };
            }
            return { field_type: "double" as const };
          }
          if (field.type === "datetime" && field.format) {
            if (field.format === "date") {
              return { field_type: "date" as const };
            }
            return { field_type: "time" as const };
          }
          if (field.type === "text" && field.format) {
            if (field.format === "phone") {
              return { field_type: "phone" as const };
            }
          }
          return {};
        }),
    },

    // Map select/multiselect options
    options: {
      read: (from) =>
        from("options", (options): FieldOption[] => {
          if (!options) return [];
          return options.map((option) => ({
            value: option.id.toString(),
            name: option.label,
          }));
        }),
      write: (to) =>
        to("options", (options): DeepPartial<PipedriveFieldOption[]> => {
          if (!options) return [];
          return options.map((option, index) => ({
            id: parseInt(option.value) || index + 1,
            label: option.name,
          }));
        }),
    },

    // Map option source type
    optionSource: {
      read: (from) => from("field_type", (): FieldOptionType => "static"),
    },
  },
  value: {
    read: async ({ field }) => {
      const { key, type, value, metadata } = field;
      const customKey = metadata?.custom_key;
      const readKey = customKey || key;
      if (!value || !(readKey in value)) {
        return undefined;
      }

      const fieldValue = value[readKey];

      if (fieldValue === null) {
        return undefined;
      }

      switch (type) {
        case "text":
        case "select":
          return fieldValue;
        case "number":
          return typeof fieldValue === "string"
            ? parseFloat(fieldValue)
            : fieldValue;
        case "boolean":
          return typeof fieldValue === "string"
            ? fieldValue === "true"
            : fieldValue;
        case "datetime":
          return fieldValue ? new Date(fieldValue as string) : undefined;
        case "list.select":
          return typeof fieldValue === "string" ? fieldValue.split(",") : [];
        default:
          return undefined;
      }
    },

    write: async ({ field }) => {
      const { key, type, value, metadata } = field;
      const customKey = metadata?.custom_key;
      const writeKey = customKey || key;
      const result: Record<string, PipedriveFieldValue> = {};

      switch (type) {
        case "text":
        case "select":
          result[writeKey] = value;
          break;
        case "number":
          result[writeKey] = value;
          break;
        case "boolean":
          result[writeKey] = value;
          break;
        case "datetime":
          result[writeKey] =
            value instanceof Date ? value.toISOString() : value;
          break;
        case "list.select":
          result[writeKey] = Array.isArray(value) ? value.join(",") : value;
          break;
      }

      return result;
    },
  },
});

export default pipedriveFieldMapper;
