import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type PipedriveDeal = {
  id: number;
  title: string;
  value: number;
  currency: string;
  add_time: string;
  update_time: string;
  stage_id: number;
  pipeline_id: number;
  user_id: {
    id: number;
  };
  person_id: {
    value: number;
  };
  org_id: {
    value: number;
  };
};

export default new Mapper<ResourceModels["crmOpportunity"], PipedriveDeal>({
  id: {
    read: (from) => from("id", (v) => v.toString()),
  },
  fields: {
    pipeline: {
      read: (from) => from("pipeline_id", (v) => ({ id: v.toString() })),
      write: (to) => to("pipeline_id", (v) => parseInt(v.id)),
    },
    stage: {
      read: (from) => from("stage_id", (v) => ({ id: v.toString() })),
      write: (to) => to("stage_id", (v) => parseInt(v.id)),
    },
    currency: {
      read: (from) => from("currency"),
      write: (to) => to("currency"),
    },
    owner: {
      read: (from) => from("user_id", (v) => ({ id: v.id.toString() })),
      write: (to) => to("user_id.id", (v) => parseInt(v.id)),
    },
    name: {
      read: (from) => from("title"),
      write: (to) => to("title"),
    },
    amount: {
      read: (from) => from("value"),
      write: (to) => to("value"),
    },
    contacts: {
      read: (from) => from("person_id", (v) => [{ id: v.value.toString() }]),
    },
    companies: {
      read: (from) => from("org_id", (v) => [{ id: v.value.toString() }]),
    },
  },
  createdAt: {
    read: (from) => from("add_time", (v) => new Date(v)),
  },
  updatedAt: {
    read: (from) => from("update_time", (v) => new Date(v)),
  },
});
