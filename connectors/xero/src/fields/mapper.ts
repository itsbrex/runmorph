import {
  FieldMapper,
  FieldType,
  DeepPartial,
  parsePhoneNumber,
} from "@runmorph/cdk";

import defaultFields from "./default";

/**
 * Xero field type as returned by the Xero API
 */
export interface XeroField {
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
 * Field mapper for Xero fields
 * Maps between Xero API field schema and unified field format
 */
export const xeroFieldMapper = new FieldMapper<XeroField, any>({
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
        to("type", (_, { field }): DeepPartial<XeroField["type"]> => {
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
      const { key, type, value, metadata } = field;

      if (!value || !value[key]) {
        return undefined;
      }

      const fieldValue = value[key];
      console.log("fieldValue", fieldValue);

      switch (type) {
        case "list.text":
          if (metadata?.type === "PhoneType") {
            // Join phone array into semicolon separated string
            return fieldValue
              .filter((phone: { PhoneNumber: string }) => phone.PhoneNumber)
              .map(
                (phone: {
                  PhoneType: "DEFAULT" | "DDI" | "MOBILE" | "FAX";
                  PhoneNumber: string; // max length = 50
                  PhoneAreaCode: string; // max length = 10
                  PhoneCountryCode: string; // max length = 20
                }) =>
                  `${phone.PhoneCountryCode || ""}${phone.PhoneAreaCode || ""}${phone.PhoneNumber || ""}`.replace(
                    /\s/g,
                    ""
                  )
              );
          } else if (metadata?.type === "AddressType") {
            // Join address array into semicolon separated string
            return fieldValue.map(
              (addr: {
                AddressType: string;
                AddressLine1: string;
                AddressLine2: string;
                AddressLine3: string;
                AddressLine4: string;
                City: string;
                Region: string;
                PostalCode: string;
                Country: string;
                AttentionTo: string;
              }) =>
                [
                  addr.AddressLine1,
                  addr.AddressLine2,
                  addr.AddressLine3,
                  addr.AddressLine4,
                  addr.City,
                  addr.Region,
                  addr.PostalCode,
                  addr.Country,
                  addr.AttentionTo,
                ]
                  .filter(Boolean)
                  .join(",")
            );
          } else {
            return fieldValue;
          }
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
      const { key, type, value, metadata } = field;
      const object: Record<string, any> = {};

      switch (type) {
        case "list.text":
          if (metadata?.type === "PhoneType") {
            // Parse semicolon separated phone numbers into array
            object[key] = value.map((phone: string) => {
              // phone is e164 format with no spaces
              const parsedPhone = parsePhoneNumber(phone);
              if (!parsedPhone) {
                return undefined;
              }
              return {
                PhoneType: "DEFAULT",
                PhoneNumber: parsedPhone.number,
                PhoneAreaCode: parsedPhone.areaCode,
                PhoneCountryCode: "+" + parsedPhone.countryCode,
              };
            });
          } else if (metadata?.type === "AddressType") {
            // Parse semicolon separated addresses into array
            object[key] = value.map((address: string) => {
              const [
                type = "POBOX",
                line1 = "",
                line2 = "",
                line3 = "",
                line4 = "",
                city = "",
                region = "",
                postalCode = "",
                country = "",
                attentionTo = "",
              ] = address.split(",");
              return {
                AddressType: type.trim(),
                AddressLine1: line1.trim().substring(0, 500),
                AddressLine2: line2.trim().substring(0, 500),
                AddressLine3: line3.trim().substring(0, 500),
                AddressLine4: line4.trim().substring(0, 500),
                City: city.trim().substring(0, 255),
                Region: region.trim().substring(0, 255),
                PostalCode: postalCode.trim().substring(0, 50),
                Country: country
                  .trim()
                  .substring(0, 50)
                  .replace(/[^A-Za-z]/g, ""),
                AttentionTo: attentionTo.trim().substring(0, 255),
              };
            });
          } else {
            object[key] = value;
          }
          break;
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

export default xeroFieldMapper;
