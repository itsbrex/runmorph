import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

import { AttioAttributeValue } from "@/types";

export type AttioPerson = {
  id: {
    workspace_id: string;
    object_id: string;
    record_id: string;
  };
  created_at: string;
  values: {
    record_id: AttioAttributeValue;
    name: AttioAttributeValue<{
      first_name: string;
      last_name: string;
      full_name: string;
    }>;
    email_addresses: AttioAttributeValue<{
      email_address: string;
      original_email_address: string;
      email_domain: string;
      email_root_domain: string;
      email_local_specifier: string;
    }>;
    phone_numbers: AttioAttributeValue<{
      phone_number: string;
      original_phone_number: string;
      country_code: string;
    }>;
    created_at: AttioAttributeValue;
  };
};

export default new Mapper<ResourceModels["genericContact"], AttioPerson>({
  id: {
    read: (from) => from("id.record_id"),
  },
  fields: {
    firstName: {
      read: (from) => from("values.name.0.first_name"),
      write: (to) =>
        to("values.name", (_, contact) => [
          {
            first_name: contact.firstName || "",
            last_name: contact.lastName || "",
            full_name:
              `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
              "",
          },
        ]),
    },
    lastName: {
      read: (from) => from("values.name.0.last_name"),
      write: (to) =>
        to("values.name", (_, contact) => [
          {
            first_name: contact.firstName || "",
            last_name: contact.lastName || "",
            full_name:
              `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
              "",
          },
        ]),
    },
    email: {
      read: (from) => from("values.email_addresses.0.email_address"),
      write: (to) => to("values.email_addresses.0.email_address"),
    },
    phone: {
      read: (from) => from("values.phone_numbers.0.original_phone_number"),
      write: (to) => to("values.phone_numbers.0.original_phone_number"),
    },
  },
  createdAt: {
    read: (from) => from("values.created_at.0.value", (v) => new Date(v)),
  },
  updatedAt: {
    read: (from) => from("*", () => new Date()), // Attio doesn't have updatedAt - use current date since we can't track updates
  },
});
