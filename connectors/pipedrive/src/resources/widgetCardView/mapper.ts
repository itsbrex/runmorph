import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

type PipedriveEntityType = "deal" | "contact" | "company";

export type PipedriveCardViewRequestAndResponse = {
  companyId: string;
  resource: PipedriveEntityType;
  selectedIds: string;
  userId: string;
  // Expected response
  data: Array<{
    header: string;
    Actions: {
      markdown: boolean;
      value: string;
    };
    [key: string]:
      | {
          color?: string;
          label?: string;
        }
      | {
          markdown?: boolean;
          value: string;
        }
      | string;
  }>;
  external_link?: {
    url: string;
    label: string;
  };
};

export default new Mapper<
  ResourceModels["widgetCardView"],
  PipedriveCardViewRequestAndResponse
>(
  {
    id: {
      read: (from) =>
        from(
          "*",
          (event) =>
            `${event.companyId?.toString() || ""}-${event.userId}-${event.resource}-${event.selectedIds}`
        ),
    },
    fields: {
      triggeredBy: {
        read: (from) => from("userId", (v) => ({ id: v })),
      },
      crmOpportunity: {
        read: (from) =>
          from("*", (v) =>
            v.resource === "deal" ? { id: v.selectedIds } : undefined
          ),
      },
      genericCompany: {
        read: (from) =>
          from("*", (v) =>
            v.resource === "company" ? { id: v.selectedIds } : undefined
          ),
      },
      genericContact: {
        read: (from) =>
          from("*", (v) =>
            v.resource === "contact" ? { id: v.selectedIds } : undefined
          ),
      },
    },
    createdAt: {
      read: (from) => from("*", () => new Date()),
    },
    updatedAt: {
      read: (from) => from("*", () => new Date()),
    },
  },
  // Card Response Mapper
  {
    cards: {
      write: (to) =>
        to("data", (cards) => {
          const pipedriveColorMappings: { [key: string]: string } = {
            default: "grey",
            success: "green",
            warning: "yellow",
            danger: "red",
            info: "blue",
          };

          return cards.map((card) => {
            const item: PipedriveCardViewRequestAndResponse["data"][0] = {
              header: card.title,
              Actions: {
                markdown: true,
                value:
                  card.actions
                    ?.map((action) => `[${action.label}](${action.url})`)
                    .join(" | ") || "",
              },
            };

            card.contents?.forEach((content) => {
              if (content.type === "status") {
                const color_key = content.status || "default";
                item[content.label] = {
                  color: pipedriveColorMappings[color_key] || "grey",
                  label: content.value,
                };
              } else {
                item[content.label] = content.link
                  ? {
                      markdown: true,
                      value: `[${content.value}](${content.link})`,
                    }
                  : content.value;
              }
            });

            return item;
          });
        }),
    },
    root: {
      write: (to) =>
        to("external_link", (root) => {
          if (!root.actions?.length) return undefined;

          const primaryAction = root.actions[0];
          return {
            url: primaryAction.url,
            label: primaryAction.label,
          };
        }),
    },
  }
);
