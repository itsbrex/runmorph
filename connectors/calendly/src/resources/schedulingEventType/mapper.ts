import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";
import { CalendlySlot } from "../schedulingSlot/mapper";

export type CalendlyEventType = {
  active: boolean;
  admin_managed: boolean;
  booking_method: string;
  color: string;
  created_at: string;
  custom_questions: Array<{
    answer_choices: string[];
    enabled: boolean;
    include_other: boolean;
    name: string;
    position: number;
    required: boolean;
    type:
      | "text"
      | "phone_number"
      | "single_line"
      | "multi_line"
      | "single_select"
      | "multi_select";
  }>;
  deleted_at: string | null;
  description_html: string;
  description_plain: string;
  duration: number;
  duration_options: number[] | null;
  internal_note: string | null;
  kind: string;
  locations: Array<{
    kind: string;
  }>;
  name: string;
  pooling_type: string | null;
  position: number;
  profile: {
    name: string;
    owner: string;
    type: string;
  };
  scheduling_url: string;
  secret: boolean;
  slug: string;
  type: string;
  updated_at: string;
  uri: string;
  _slots?: CalendlySlot[];
};

export default new Mapper<
  ResourceModels["schedulingEventType"],
  CalendlyEventType
>({
  id: {
    read: (from) =>
      from(
        "uri",
        (uri) =>
          "res_" + Buffer.from(uri.split("/").pop() || "").toString("base64")
      ),
  },
  fields: {
    name: {
      read: (from) => from("name"),
    },
    status: {
      read: (from) =>
        from("active", (active) => (active ? "active" : "inactive")),
    },
    durations: {
      read: (from) =>
        from("*", (eventType) =>
          eventType.duration
            ? [eventType.duration]
            : eventType.duration_options
              ? eventType.duration_options
              : []
        ),
    },
    questions: {
      read: (from) =>
        from("custom_questions", (questions) =>
          questions.map((q) => {
            const baseQuestion = {
              key: Buffer.from(q.name).toString("base64"),
              name: q.name,
              required: q.required,
            };

            switch (q.type) {
              case "single_select":
              case "multi_select":
                return {
                  ...baseQuestion,
                  type:
                    q.type === "multi_select"
                      ? ("multiselect" as const)
                      : ("select" as const),
                  options: q.answer_choices.map((choice) => ({
                    value: choice,
                    name: choice,
                  })),
                };
              case "text":
              case "phone_number":
              case "single_line":
              case "multi_line":
              default:
                return {
                  ...baseQuestion,
                  type: "text" as const,
                };
            }
          })
        ),
    },
    schedulingUrl: {
      read: (from) => from("scheduling_url"),
    },
    slots: {
      read: (from) =>
        from("_slots", (slots) =>
          slots
            ? slots?.map((slot) => ({
                id: JSON.stringify({
                  eventType: slot.event_type_id,
                  startAt: slot.start_time,
                }),
                rawResource: slot,
              }))
            : undefined
        ),
      key: "associated::slots",
    },
    owner: {
      read: (from) =>
        from("profile.owner", (url) => ({
          id: url.split("/").pop() || "",
        })),
    },
  },
  createdAt: {
    read: (from) =>
      from("created_at", (date) => (date ? new Date(date) : new Date())),
  },
  updatedAt: {
    read: (from) =>
      from("updated_at", (date) => (date ? new Date(date) : new Date())),
  },
});
