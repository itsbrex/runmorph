import { GlobalEventMapper } from "@runmorph/cdk";

import PipedriveCardViewMapper from "../../resources/widgetCardView/mapper";

type PipedriveCardViewQuery = {
  companyId?: string;
  resource?: "deal" | "contact" | "company";
  selectedIds?: string;
  userId?: string;
};

export default new GlobalEventMapper({
  eventRoutes: {
    cardView: {
      widgetCardView: {
        mapper: PipedriveCardViewMapper,
        triggers: ["created"],
      },
    },
  },
  identifier: async (request, { route }) => {
    switch (route) {
      case "cardView": {
        const { query } = request as { query: PipedriveCardViewQuery };
        if (!query.companyId) {
          return {
            error: {
              code: "CONNECTOR::WEBHOOK::MAPPER_FAILED",
              message: "Missing companyId in query parameters",
            },
          };
        }
        return {
          model: "widgetCardView",
          trigger: "created",
          identifierKey: query.companyId,
        };
      }
      default:
        return {
          error: {
            code: "CONNECTOR::WEBHOOK::MAPPER_FAILED",
            message: `Invalid route: ${route}`,
          },
        };
    }
  },
  handler: async (request, { model }) => {
    if (model === "widgetCardView") {
      const { query } = request as { query: PipedriveCardViewQuery };
      return {
        rawResource: query,
        idempotencyKey: `${query.companyId}-${query.resource}-${query.selectedIds}-${query.userId}-${Date.now()}`,
      };
    } else {
      return {
        error: {
          code: "CONNECTOR::WEBHOOK::MAPPER_FAILED",
          message: `Unsupported model: ${model}`,
        },
      };
    }
  },
});
