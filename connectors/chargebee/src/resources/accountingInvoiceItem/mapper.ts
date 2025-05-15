import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type ChargebeeItem = {
  id: string;
  name: string;
  external_name?: string;
  description: string;
  status?: "active" | "archived" | "deleted";
  resource_version?: number;
  updated_at?: number;
  item_family_id: string;
  type: "plan" | "addon" | "charge";
  is_shippable?: boolean;
  is_giftable: boolean;
  redirect_url?: string;
  enabled_for_checkout: boolean;
  enabled_in_portal: boolean;
  included_in_mrr?: boolean;
  item_applicability?: "all" | "restricted";
  gift_claim_redirect_url?: string;
  unit?: string;
  metered: boolean;
  usage_calculation?: "sum_of_usages" | "last_usage" | "max_usage";
  is_percentage_pricing?: boolean;
  archived_at?: number;
  channel?: "web" | "app_store" | "play_store";
  metadata?: Record<string, unknown>;
  deleted: boolean;
  business_entity_id?: string;
};

export type ChargebeeItemPrice = {
  created_at: number;
  currency_code: string;
  external_name?: string;
  free_quantity: number;
  id: string;
  is_taxable: boolean;
  item_id: string;
  item_type: "plan" | "addon" | "charge";
  name: string;
  object: "item_price";
  period: number;
  period_unit: "month" | "year" | "week" | "day";
  price: number;
  pricing_model: "per_unit" | "tiered" | "volume" | "stairstep";
  resource_version: number;
  status: "active" | "archived" | "deleted";
  updated_at: number;
};

export type ChargebeeComposedItem = ChargebeeItemPrice & {
  _item: ChargebeeItem;
};

export default new Mapper<
  ResourceModels["accountingInvoiceItem"],
  ChargebeeComposedItem
>({
  id: {
    read: (from) => from("id"),
  },
  fields: {
    name: {
      read: (from) => from("_item.name"),
      write: (to) => to("_item.name"),
    },
    description: {
      read: (from) => from("_item.description"),
      write: (to) => to("_item.description"),
    },
    code: {
      read: (from) => from("_item.id"),
      write: (to) => to("_item.id"),
    },
    price: {
      read: (from) => from("price"),
      write: (to) => to("price"),
    },
    currency: {
      read: (from) => from("currency_code"),
      write: (to) => to("currency_code"),
    },
  },
  createdAt: {
    read: (from) =>
      from("created_at", (created_at) =>
        created_at ? new Date(created_at * 1000) : undefined
      ),
  },
  updatedAt: {
    read: (from) =>
      from("updated_at", (updated_at) =>
        updated_at ? new Date(updated_at * 1000) : undefined
      ),
  },
});
