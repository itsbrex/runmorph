import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type DialpadUser = {
  admin_office_ids?: number[];
  company_id?: number;
  country?: string;
  date_active?: string;
  date_added?: string;
  date_first_login?: string;
  display_name?: string;
  do_not_disturb?: boolean;
  duty_status_reason?: string;
  duty_status_started?: string;
  emails?: string[];
  extension?: string;
  first_name: string;
  forwarding_numbers?: string[];
  group_details?: Array<{
    do_not_disturb?: boolean;
    group_id?: number;
    group_type?:
      | "callcenter"
      | "callrouter"
      | "channel"
      | "coachinggroup"
      | "coachingteam"
      | "department"
      | "office"
      | "room"
      | "staffgroup"
      | "unknown"
      | "user";
    role?: "admin" | "operator" | "supervisor";
  }>;
  id?: number;
  image_url?: string;
  international_dialing_enabled?: boolean;
  is_admin?: boolean;
  is_available?: boolean;
  is_on_duty?: boolean;
  is_online?: boolean;
  is_super_admin?: boolean;
  job_title?: string;
  language?: string;
  last_name: string;
  license?:
    | "admins"
    | "agents"
    | "dpde_all"
    | "dpde_one"
    | "lite_lines"
    | "lite_support_agents"
    | "magenta_lines"
    | "talk";
  location?: string;
  muted?: boolean;
  office_id?: number;
  on_duty_started?: string;
  on_duty_status?:
    | "available"
    | "busy"
    | "occupied"
    | "occupied-end"
    | "unavailable"
    | "wrapup"
    | "wrapup-end";
  phone_numbers?: string[];
  state?: "active" | "cancelled" | "deleted" | "pending" | "suspended";
  status_message?: string;
  timezone?: string;
};

export default new Mapper<ResourceModels["genericUser"], DialpadUser>({
  id: {
    read: (from) => from("id", (id) => id?.toString()),
  },
  fields: {
    firstName: {
      read: (from) => from("first_name"),
    },
    lastName: {
      read: (from) => from("last_name"),
    },
    email: {
      read: (from) => from("emails", (emails) => emails?.[0]),
    },
  },
  createdAt: {
    read: (from) =>
      from("date_added", (date) => (date ? new Date(date) : undefined)),
  },
  updatedAt: {
    read: (from) =>
      from("date_added", (date) => (date ? new Date(date) : undefined)),
  },
});
