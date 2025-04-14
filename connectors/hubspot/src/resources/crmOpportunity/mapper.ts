import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type HubSpotDeal = {
  id: string;
  properties: {
    amount: string;
    deal_currency_code: string;
    closedate: string;
    createdate: string;
    dealname: string;
    dealstage: string;
    hs_lastmodifieddate: string;
    hs_object_id: string;
    hubspot_owner_id: string;
    pipeline: string;
  };
  associations: {
    contacts: {
      results: Array<{
        id: string;
        type: string;
      }>;
    };
    companies: {
      results: Array<{
        id: string;
        type: string;
      }>;
    };
    engagements: {
      results: Array<{
        id: string;
        type: string;
      }>;
    };
  };
  createdAt: string;
  updatedAt: string;
};

export default new Mapper<ResourceModels["crmOpportunity"], HubSpotDeal>({
  id: {
    read: (from) => from("id"),
  },
  fields: {
    pipeline: {
      read: (from) => from("properties.pipeline", (v) => ({ id: v })),
      write: (to) => to("properties.pipeline", (v) => v.id),
      key: "pipeline",
    },
    stage: {
      read: (from) =>
        // maybe return resource(crmStage).id directly ? Not sure
        from("properties.dealstage", (stageId, d) =>
          d.properties.pipeline && stageId
            ? {
                id: `${d.properties.pipeline}::${stageId}`,
              }
            : undefined
        ),
      write: (to) =>
        to("properties.dealstage", (v) => {
          // maybe return only rawResource (HubSpotStage) to do h_stage.id
          // eslint-disable-next-line @typescript-eslint/no-unused-vars -- expected
          const [_pipelineId, stageId] = v.id.split("::");
          return stageId;
        }),
      key: "dealstage",
    },
    currency: {
      read: (from) => from("properties.deal_currency_code"),
      write: (to) => to("properties.deal_currency_code"),
      key: "deal_currency_code",
    },
    owner: {
      read: (from) => from("properties.hubspot_owner_id", (v) => ({ id: v })),
      write: (to) => to("properties.hubspot_owner_id", (v) => v.id),
      key: "hubspot_owner_id",
    },
    name: {
      read: (from) => from("properties.dealname"),
      write: (to) => to("properties.dealname"),
      key: "dealname",
    },
    amount: {
      read: (from) =>
        from("properties.amount", (v) => (v ? parseFloat(v) : undefined)),
      write: (to) => to("properties.amount", (v) => v.toString()),
      key: "amount",
    },
    contacts: {
      read: (from) =>
        from("associations.contacts.results", (v) => {
          return (v || [])
            .filter((c) => c.type === "deal_to_contact")
            .map(function (hsContact) {
              return {
                id: hsContact.id,
              };
            });
        }),
      write: (to) =>
        to("associations.contacts.results", (v) => {
          return (v || []).map(function (contact) {
            if (contact) {
              return {
                id: contact.id,
                type: "deal_to_contact",
              };
            }
          });
        }),
      key: "association::contacts",
    },
    companies: {
      read: (from) =>
        from("associations.companies.results", (v) => {
          return (v || [])
            .filter((c) => c.type === "deal_to_company")
            .map(function (hsContact) {
              return {
                id: hsContact.id,
              };
            });
        }),
      write: (to) =>
        to("associations.companies.results", (v) => {
          return (v || []).map(function (company) {
            if (company) {
              return {
                id: company.id,
                type: "deal_to_company",
              };
            }
          });
        }),
      key: "association::companies",
    },
    engagements: {
      read: (from) =>
        from("associations.engagements.results", (v) => {
          return (v || [])
            .filter((e) => e.type === "deal_to_engagement")
            .map(function (hsEngagement) {
              return {
                id: hsEngagement.id,
              };
            });
        }),
      key: "association::engagements",
    },
  },
  createdAt: {
    read: (from) => from("createdAt", (v) => new Date(v)),
  },
  updatedAt: {
    read: (from) => from("updatedAt", (v) => new Date(v)),
  },
});
