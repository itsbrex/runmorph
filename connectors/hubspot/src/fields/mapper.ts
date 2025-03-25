import {
  FieldMapper,
  FieldType,
  FieldTypeFormat,
  FieldOption,
  FieldOptionType,
  UnifiedField,
  DeepPartial,
} from "@runmorph/cdk";

/**
 * HubSpot property field type as returned by the HubSpot CRM API
 */
export interface HubSpotProperty {
  name: string;
  label: string;
  description?: string;
  groupName: string;
  type:
    | "string"
    | "number"
    | "date"
    | "datetime"
    | "enumeration"
    | "bool"
    | "json"
    | "object_coordinates";
  fieldType:
    | "textarea"
    | "text"
    | "date"
    | "file"
    | "number"
    | "select"
    | "radio"
    | "checkbox"
    | "booleancheckbox"
    | "calculation_equation"
    | "html"
    | "phonenumber";
  options?: HubSpotPropertyOption[];
  hidden?: boolean;
  formField?: boolean;
  calculated?: boolean;
  showCurrencySymbol?: boolean;
  required?: boolean;
  hasUniqueValue?: boolean;
  createdAt?: string;
  updatedAt?: string;
  archived?: boolean;
  archivedAt?: string;
  hubspotDefined?: boolean;
  displayOrder?: number;
  modificationMetadata?: {
    readOnlyOptions?: boolean;
    readOnlyValue?: boolean;
    readOnlyDefinition?: boolean;
    archivable?: boolean;
  };
}

/**
 * HubSpot property option as returned by the HubSpot CRM API
 */
export interface HubSpotPropertyOption {
  label: string;
  value: string;
  displayOrder?: number;
  hidden?: boolean;
  description?: string;
}

/**
 * Type guard to check if a field has a format property
 */
function hasFormat(
  field: UnifiedField
): field is UnifiedField & { format: FieldTypeFormat<any> } {
  return "format" in field && typeof field.format === "string";
}

/**
 * HubSpot property value as returned within contact objects
 */
export type HubSpotPropertyValue = string | number | boolean | null;

/**
 * HubSpot properties object as returned in contact objects
 */
export type HubSpotPropertyValues = Record<string, HubSpotPropertyValue>;

/**
 * Interface for HubSpot property value with history
 */
export interface HubSpotObjectPropertyValue {
  properties: Record<string, string>;
}

export type HubSpotPrpertyCompositeKeys = "propType";
/**
 * Field mapper for HubSpot contact properties
 * Maps between HubSpot API property schema and unified field format
 */
export const hubspotFieldMapper = new FieldMapper<
  HubSpotProperty,
  HubSpotObjectPropertyValue,
  HubSpotPrpertyCompositeKeys
>({
  field: {
    // Map the unique identifier
    key: {
      read: (from) => from("name"),
      write: (to) => to("name"),
    },

    // Map the unique identifier
    metadata: {
      read: (from) =>
        from("type", (type) => ({
          propType: type,
        })),
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
    isReadOnly: {
      read: (from) =>
        from(
          "modificationMetadata.readOnlyValue",
          (readOnlyValue) => readOnlyValue
        ),
    },

    // Map whether the field is custom
    isCustom: {
      read: (from) =>
        from("hubspotDefined", (hubspotDefined) => !hubspotDefined),
    },

    // Map the field type - using both 'type' and 'fieldType' fields from HubSpot
    type: {
      read: (from) =>
        from("type", (propType, { remoteField }): FieldType => {
          const fieldTypeValue = remoteField.fieldType;

          // Map according to HubSpot's documentation on type and fieldType relationships
          switch (propType) {
            case "string":
              // String can have various field types, but all map to "text" in our system
              return "text";

            case "number":
              return "number";

            case "date":
            case "datetime":
              return "datetime";

            case "bool":
              // Boolean type always maps to our boolean type
              return "boolean";

            case "enumeration":
              // Enumeration type can be either select or multiselect depending on fieldType
              if (fieldTypeValue === "checkbox") {
                // Checkbox fieldType for enumeration means multiple selections
                return "multiselect";
              } else if (
                fieldTypeValue === "radio" ||
                fieldTypeValue === "select"
              ) {
                // Radio and select fieldTypes for enumeration mean single selection
                return "select";
              } else if (fieldTypeValue === "booleancheckbox") {
                // Single booleancheckbox is a special case that translates to boolean
                return "boolean";
              }
              // Default to select for other enumeration fieldTypes
              return "select";

            default:
              // For types we don't explicitly handle, fall back to fieldType
              switch (fieldTypeValue) {
                case "text":
                case "textarea":
                case "html":
                case "phonenumber":
                case "file":
                  return "text";
                case "number":
                  return "number";
                case "date":
                  return "datetime";
                case "checkbox":
                  return "multiselect";
                case "booleancheckbox":
                  return "boolean";
                case "select":
                case "radio":
                  return "select";
                default:
                  return "text"; // Default to text for unknown types
              }
          }
        }),
      write: (to) =>
        to("type", (_, { field }): DeepPartial<HubSpotProperty["type"]> => {
          const { type } = field;
          // Map from unified field type to HubSpot type
          switch (type) {
            case "text":
              return "string";
            case "number":
              return "number";
            case "datetime":
              return field.format === "date" ? "date" : "datetime";
            case "boolean":
              return "bool";
            case "select":
            case "multiselect":
              return "enumeration";
            default:
              return "string";
          }
        }),
    },

    // Map the field format
    format: {
      read: (from) =>
        from(
          "type",
          (propType, { remoteField }): FieldTypeFormat<any> | undefined => {
            const fieldTypeValue = remoteField.fieldType;

            // Handle special field types
            switch (propType) {
              case "string":
                // Handle special string formats
                if (fieldTypeValue === "phonenumber") {
                  return "phone";
                }
                return undefined;

              case "number":
                // Handle number formats
                if (remoteField.showCurrencySymbol) {
                  return "currency";
                }
                return "float"; // Default to float for numbers

              case "date":
                return "date";

              case "datetime":
                return "timestamp";

              default:
                return undefined;
            }
          }
        ),
      write: (to) => {
        // Handle currency symbol
        to("showCurrencySymbol", (format, { field }) => {
          if (field.type === "number" && format === "currency") {
            return true;
          }
          return false;
        });

        // Handle field type based on format
        to("fieldType", (format, { field }) => {
          switch (format) {
            case "date":
            case "timestamp":
              return "date";
            case "phone":
              return "phonenumber";
            case "currency":
            case "float":
            case "integer":
              return "number";
            default:
              return "text";
          }
        });
      },
    },

    // Map the currency settings
    unit: {
      read: (from) =>
        from("showCurrencySymbol", (showCurrencySymbol) => {
          // HubSpot API doesn't provide the specific currency unit in property definitions
          // This would need to be configured in the account settings or retrieved separately
          return showCurrencySymbol ? "USD" : undefined;
        }),
      write: (to) =>
        to("showCurrencySymbol", (unit, { field }) => {
          if (
            field.type === "number" &&
            hasFormat(field) &&
            field.format === "currency"
          ) {
            return true;
          }
          return false;
        }),
    },

    // Map select/multiselect options
    options: {
      read: (from) =>
        from("options", (options): FieldOption[] => {
          if (!options) return [];
          return options.map((option) => ({
            value: option.value,
            name: option.label,
          }));
        }),
      write: (to) =>
        to("options", (options): DeepPartial<HubSpotPropertyOption[]> => {
          if (!options) return [];

          return options.map((option, index) => ({
            value: option.value,
            label: option.name,
            displayOrder: index,
            hidden: false,
          }));
        }),
    },

    // Map option source type
    optionSource: {
      read: (from) => from("type", (): FieldOptionType => "static"),
    },
  },
  value: {
    /**
     * Read a field value from HubSpot's property values format
     */
    read: async ({ field }) => {
      const { key, type, value } = field;

      const { properties } = value;
      // If the property doesn't exist in the values, return undefined
      if (!value || !(key in properties)) {
        return undefined;
      }

      const propertyValue = properties[key];

      // Handle null values
      if (propertyValue === null) {
        return undefined;
      }

      // Convert the value based on the field type
      switch (type) {
        case "text":
        case "select":
          return propertyValue;

        case "number":
          // HubSpot stores numbers as strings in some cases
          if (typeof propertyValue === "string") {
            return parseFloat(propertyValue);
          }
          return propertyValue;

        case "boolean":
          // Handle boolean values that may be stored as strings "true"/"false" or actual booleans
          if (typeof propertyValue === "string") {
            const normalizedValue = propertyValue.toLowerCase().trim();
            return (
              normalizedValue === "true" ||
              normalizedValue === "yes" ||
              normalizedValue === "1"
            );
          }
          return undefined;

        case "datetime":
          // HubSpot stores dates as ISO strings
          if (propertyValue && typeof propertyValue === "string") {
            return new Date(propertyValue);
          }
          return undefined;

        case "multiselect":
          // HubSpot stores multiselect values as comma-separated strings
          if (typeof propertyValue === "string") {
            return propertyValue.split(";");
          }
          return [];

        default:
          return undefined;
      }
    },

    /**
     * Write a field value in HubSpot's property values format
     */
    write: async ({ field }) => {
      const { key, type, value } = field;
      const object: HubSpotObjectPropertyValue = { properties: {} };
      switch (type) {
        case "text":
        case "select":
          object.properties[key] = value;
          break;

        case "number":
          object.properties[key] = value?.toString();
          break;

        case "boolean":
          object.properties[key] = value ? "true" : "false";
          break;

        case "datetime":
          if (value instanceof Date) {
            object.properties[key] = value.toISOString();
          }
          break;

        case "multiselect":
          if (Array.isArray(value)) {
            object.properties[key] = value.join(";");
          }
          break;
      }

      return object;
    },
  },
});

export default hubspotFieldMapper;
