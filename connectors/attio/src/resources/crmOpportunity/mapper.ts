import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

import { AttioAttributeValue } from "@/types";

export type AttioDeal = {
  id: {
    workspace_id: string;
    object_id: string;
    record_id: string;
  };
  created_at: string;
  values: {
    record_id: AttioAttributeValue;
    name: AttioAttributeValue;
    stage: AttioAttributeValue<{
      status:
        | {
            id: {
              status_id: string;
            };
          }
        | string;
    }>;
    owner: AttioAttributeValue<{
      referenced_actor_type: string;
      referenced_actor_id: string;
    }>;
    value: AttioAttributeValue<{
      currency_code: string;
      currency_value: number;
    }>;
    associated_people: AttioAttributeValue<{
      target_object: string;
      target_record_id: string;
      attribute_type: string;
    }>;
    associated_company: AttioAttributeValue<{
      target_object: string;
      target_record_id: string;
      attribute_type: string;
    }>;
    created_at: AttioAttributeValue;
  };
};

export default new Mapper<ResourceModels["crmOpportunity"], AttioDeal>({
  id: {
    read: (from) => from("id.record_id"),
  },
  fields: {
    name: {
      read: (from) => from("values.name.0.value"),
      write: (to) => to("values.name.0.value"),
    },
    pipeline: {
      read: (from) => from("id.object_id", (_) => ({ id: "deals" })),
      write: (to) => to("id.object_id", (_) => "deals"),
    },
    stage: {
      read: (from) =>
        from("values.stage.0.status.id.status_id", (v) => ({ id: v })),
      write: (to) => to("values.stage.0.status", (v) => v.id),
    },
    owner: {
      read: (from) =>
        from("values.owner.0.referenced_actor_id", (referenced_actor_id) => ({
          id: referenced_actor_id,
        })),
      write: (to) =>
        to("values.owner", (owner) => [
          {
            referenced_actor_type: "workspace-member",
            referenced_actor_id: owner.id,
          },
        ]),
    },
    amount: {
      read: (from) => from("values.value.0.currency_value"),
      write: (to) => to("values.value.0.currency_value"),
    },
    currency: {
      read: (from) => from("values.value.0.currency_code"),
      write: (to) => to("values.value.0.currency_code"),
    },
    contacts: {
      read: (from) =>
        from("values.associated_people", (associated_people) =>
          associated_people.map((people) => ({
            id: people.target_record_id,
          }))
        ),
      write: (to) =>
        to(
          "values.associated_people",
          (contacts) =>
            contacts &&
            contacts.map(
              (contact) =>
                contact && {
                  target_record_id: contact.id,
                }
            )
        ),
    },
    companies: {
      read: (from) =>
        from("values.associated_company", (associated_companies) =>
          associated_companies.map((company) => ({
            id: company.target_record_id,
          }))
        ),
      write: (to) =>
        to(
          "values.associated_company",
          (companies) =>
            companies &&
            companies.map(
              (company) =>
                company && {
                  target_record_id: company.id,
                }
            )
        ),
    },
  },
  createdAt: {
    read: (from) => from("values.created_at.0.value", (v) => new Date(v)),
  },
  updatedAt: {
    read: (from) => from("*", () => new Date()), // Attio doesn't have updatedAt - use current date
  },
});
