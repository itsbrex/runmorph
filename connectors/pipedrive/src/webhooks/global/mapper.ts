import { GlobalEventMapper } from "@runmorph/cdk";

import HubSpotCardViewMapper from "../../resources/widgetCardView/mapper";

type PipedriveCardViewQuery = {
  companyId?: string;
  resource?: "deal" | "contact" | "company";
  selectedIds?: string;
  userId?: string;
};

export default new GlobalEventMapper({
  eventRouter: {
    cardView: {
      widgetCardView: ["created"],
    },
  },
  handler: async ({ request, globalRoute }) => {
    console.log("request", request);
    switch (globalRoute) {
      case "cardView": {
        const { query } = request as { query: PipedriveCardViewQuery };
        return [
          {
            mapper: HubSpotCardViewMapper,
            trigger: "created",
            rawResource: query,
            identifierKey: `${query.companyId}-${globalRoute}-widgetCardView-created`,
            idempotencyKey: `${query.companyId}-${globalRoute}-${query.resource}-${query.selectedIds}-${query.userId}-${Date.now()}`,
          },
        ];
      }
    }
  },
});
