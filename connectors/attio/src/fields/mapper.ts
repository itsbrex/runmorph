import {
  FieldMapper,
  FieldType,
  FieldTypeFormat,
  FieldOption,
  FieldOptionType,
  UnifiedField,
  DeepPartial,
  ISOCurrencyCode,
} from "@runmorph/cdk";

export type AttioAttributeType =
  | "text"
  | "number"
  | "checkbox"
  | "currency"
  | "date"
  | "timestamp"
  | "rating"
  | "status"
  | "select"
  | "record-reference"
  | "actor-reference"
  | "location"
  | "domain"
  | "email-address"
  | "phone-number"
  | "interaction"
  | "personal-name";

/**
 * Attio attribute field type as returned by the Attio API
 */
export interface AttioAttribute {
  id: {
    workspace_id: string;
    object_id: string;
    attribute_id: string;
  };
  title: string;
  description: string | null;
  api_slug: string;
  type: AttioAttributeType;
  is_system_attribute: boolean;
  is_writable: boolean;
  is_required: boolean;
  is_unique: boolean;
  is_multiselect: boolean;
  is_default_value_enabled: boolean;
  is_archived: boolean;
  default_value: any;
  relationship: {
    id: {
      workspace_id: string;
      object_id: string;
      attribute_id: string;
    };
  } | null;
  created_at: string;
  config: {
    currency: {
      default_currency_code: string | null;
      display_type: string | null;
    };
    record_reference: {
      allowed_object_ids: string[] | null;
    };
  };
  _options: { value: string; name: string }[];
}

/**
 * Attio attribute value as returned within record objects
 */
export interface AttioAttributeValue<
  TAttrType extends AttioAttributeType = AttioAttributeType,
> {
  active_from: string;
  active_until: string | null;
  created_by_actor: {
    type: string;
    id: string;
  };
  attribute_type: TAttrType;
  value?: TAttrType extends
    | "text"
    | "email-address"
    | "phone-number"
    | "url"
    | "date"
    | "timestamp"
    ? string
    : TAttrType extends "checkbox"
      ? boolean
      : TAttrType extends "number" | "currency"
        ? number
        : never;
  option?: {
    id: {
      workspace_id: string;
      object_id: string;
      attribute_id: string;
      option_id: string;
    };
    title: string;
    is_archived: boolean;
  };
  currency_value?: number;
  currency_code?: string;
  target_object?: string;
  target_record_id?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email_address?: string;
  original_email_address?: string;
  email_domain?: string;
  email_root_domain?: string;
  email_local_specifier?: string;
  phone_number?: string;
  original_phone_number?: string;
}

/**
 * Attio record data structure
 */
export interface AttioRecord {
  values: Record<string, AttioAttributeValue[]>;
}

export type AttioAttributeCompositeKeys = "attrType";

/**
 * Field mapper for Attio attributes
 * Maps between Attio API attribute schema and unified field format
 */
export const attioFieldMapper = new FieldMapper<
  AttioAttribute,
  AttioRecord,
  AttioAttributeCompositeKeys
>({
  field: {
    // Map the unique identifier
    key: {
      read: (from) => from("api_slug"),
      write: (to) => to("api_slug"),
    },

    // Map the unique identifier
    metadata: {
      read: (from) =>
        from("type", (type) => ({
          attrType: type,
        })),
    },

    // Map the human-readable name
    name: {
      read: (from) => from("title"),
      write: (to) => to("title"),
    },

    // Map the description
    description: {
      read: (from) => from("description"),
      write: (to) => to("description"),
    },

    // Map whether the field is required
    isRequired: {
      read: (from) =>
        from("is_required", (is_required) =>
          is_required === undefined ? false : is_required
        ),
      write: (to) => to("is_required"),
    },

    // Map whether the field is read-only
    isFieldReadOnly: {
      read: (from) =>
        from("is_writable", (is_writable) =>
          is_writable === undefined ? true : !is_writable
        ),
    },

    // Map whether the field value is read-only
    isValueReadOnly: {
      read: (from) =>
        from("is_writable", (is_writable) =>
          is_writable === undefined ? true : !is_writable
        ),
    },

    // Map whether the field is custom
    isCustom: {
      read: (from) =>
        from("is_system_attribute", (is_system_attribute) =>
          is_system_attribute === undefined ? false : !is_system_attribute
        ),
    },

    // Map the field type
    type: {
      read: (from) =>
        from("type", (type, { remoteField }): FieldType => {
          switch (type) {
            case "text":
            case "domain":
            case "email-address":
            case "phone-number":
            case "personal-name":
              return "text";
            case "number":
              return "number";
            case "checkbox":
              return "boolean";
            case "date":
            case "timestamp":
            case "interaction":
              return "datetime";
            case "select":
            case "record-reference":
            case "actor-reference":
              return remoteField.is_multiselect ? "multiselect" : "select";
            default:
              return "text";
          }
        }),
      write: (to) =>
        to("type", (_, { field }): DeepPartial<AttioAttribute["type"]> => {
          switch (field.type) {
            case "text":
              return "text";
            case "number":
              return "number";
            case "boolean":
              return "checkbox";
            case "datetime":
              return field.format === "date" ? "date" : "timestamp";
            case "select":
            case "multiselect":
              return "select";
            default:
              return "text";
          }
        }),
    },

    // Map the field format
    format: {
      read: (from) =>
        from("type", (type): FieldTypeFormat<any> | undefined => {
          switch (type) {
            case "currency":
              return "currency";
            case "date":
              return "date";
            case "timestamp":
            case "interaction":
              return "timestamp";
            case "phone-number":
              return "phone";
            case "email-address":
              return "email";
            default:
              return undefined;
          }
        }),
    },

    // Map the currency settings
    unit: {
      read: (from) =>
        from(
          "config.currency.default_currency_code",
          (default_currency_code) => default_currency_code as ISOCurrencyCode
        ),
    },

    // Map select/multiselect options for "static" attribute (status and select)
    options: {
      read: (from) => from("_options"),
      write: (from) => from("_options"),
    },

    // Map option source type
    optionSource: {
      read: (from) =>
        from("_options", (options) => (options ? "static" : undefined)),
    },
  },
  value: {
    /**
     * Read a field value from Attio's attribute values format
     */
    read: async ({ field }) => {
      const { key, type, metadata, value } = field;
      const { attrType } = metadata;

      if (!value.values?.[key]?.[0]) {
        return undefined;
      }

      const attributeValues = value.values[key];

      switch (type) {
        case "text":
          if (attrType === "personal-name") {
            return attributeValues[0]?.full_name;
          } else if (attrType === "email-address") {
            return attributeValues[0]?.email_address;
          } else if (attrType === "phone-number") {
            return attributeValues[0]?.phone_number;
          }
          return attributeValues[0]?.value ?? undefined;
        case "number":
          return attributeValues[0]?.value ?? undefined;
        case "boolean":
          return attributeValues[0]?.value ?? undefined;
        case "datetime":
          return attributeValues[0]?.value
            ? new Date(attributeValues[0]?.value as string)
            : undefined;
        case "select":
          return attributeValues[0]?.option?.id.option_id ?? undefined;
        case "multiselect":
          return attributeValues
            .map((v) => v.option?.id.option_id)
            .filter((v): v is string => !!v);
        default:
          return undefined;
      }
    },

    /**
     * Write a field value in Attio's attribute values format
     */
    write: async ({ field }) => {
      const { key, type, value } = field;

      const attributeValue: any = {
        values: {
          [key]: [],
        },
      };

      switch (type) {
        case "text":
        case "number":
        case "boolean":
          attributeValue.values[key].push({
            value: value,
          });
          break;

        case "datetime":
          if (value instanceof Date) {
            attributeValue.values[key].push({
              value: value.toISOString(),
            });
          }
          break;

        case "select":
          attributeValue.values[key].push({
            option: value,
          });
          break;

        case "multiselect":
          if (Array.isArray(value)) {
            attributeValue.values[key] = value.map((v) => ({
              option: v,
            }));
          }
          break;
      }

      return attributeValue;
    },
  },
});

export default attioFieldMapper;
