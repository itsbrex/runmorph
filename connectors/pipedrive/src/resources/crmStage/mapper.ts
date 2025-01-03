import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type PipedriveStage = {
  id: number;
  order_nr: number;
  name: string;
  active_flag: boolean;
  deal_probability: number;
  pipeline_id: number;
  rotten_flag: boolean;
  rotten_days: number;
  add_time: string;
  update_time: string | null;
  deals_summary: string[];
};

export default new Mapper<ResourceModels["crmStage"], PipedriveStage>({
  id: {
    read: (from) => from("id", (v) => v.toString()),
  },
  fields: {
    name: {
      read: (from) => from("name"),
      write: (to) => to("name"),
    },
    type: {
      read: (from) =>
        from("*", (_, stage) => {
          if (!stage.active_flag) return "UNKNOWN";
          if (stage.deal_probability === 0) {
            return "LOST";
          } else if (stage.deal_probability === 100) {
            return "WON";
          } else {
            return "OPEN";
          }
        }),
    },
    pipeline: {
      read: (from) =>
        from("pipeline_id", (v) => ({
          id: v.toString(),
        })),
    },
  },
  createdAt: {
    read: (from) => from("add_time", (add_time) => new Date(add_time)),
  },
  updatedAt: {
    read: (from) =>
      from("add_time", (add_time, stage) =>
        stage.update_time ? new Date(stage.update_time) : new Date(add_time),
      ),
  },
});
