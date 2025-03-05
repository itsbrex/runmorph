import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

// UsingHubSpot engagement stable API version V1
export type HubSpotEngagementType =
  | "NOTE"
  | "EMAIL"
  | "TASK"
  | "MEETING"
  | "CALL";

export type HubSpotEngagementStatus =
  | "NOT_STARTED"
  | "COMPLETED"
  | "IN_PROGRESS"
  | "WAITING"
  | "DEFERRED";

export type HubSpotObjectType = "CONTACT" | "COMPANY";

export type HubSpotMeetingOutcome =
  | "SCHEDULED"
  | "COMPLETED"
  | "RESCHEDULED"
  | "NO_SHOW"
  | "CANCELED";

export type HubSpotCallDirection = "INBOUND" | "OUTBOUND";

export type HubSpotEngagement = {
  engagement: {
    id: number;
    portalId: number;
    active: boolean;
    createdAt: number;
    lastUpdated: number;
    ownerId: number;
    type: HubSpotEngagementType;
    timestamp: number;
  };
  associations: {
    contactIds: number[];
    companyIds: number[];
    dealIds: number[];
    ownerIds: number[];
    workflowIds: number[];
    ticketIds: number[];
  };
  attachments: Array<{
    id: number;
  }>;
  metadata: {
    // Note metadata
    body?: string;
    // Email metadata
    from?: {
      email: string;
      firstName?: string;
      lastName?: string;
    };
    to?: Array<{
      email: string;
    }>;
    cc?: Array<{
      email: string;
    }>;
    bcc?: Array<{
      email: string;
    }>;
    subject?: string;
    html?: string;
    text?: string;
    // Task metadata
    status?: HubSpotEngagementStatus;
    forObjectType?: HubSpotObjectType;
    // Meeting metadata
    startTime?: number;
    endTime?: number;
    title?: string;
    internalMeetingNotes?: string;
    meetingOutcome?: HubSpotMeetingOutcome;
    // Call metadata
    toNumber?: string;
    fromNumber?: string;
    externalId?: string;
    durationMilliseconds?: number;
    externalAccountId?: string;
    recordingUrl?: string;
    disposition?: string;
    direction?: HubSpotCallDirection;
  };
};

export default new Mapper<ResourceModels["crmEngagement"], HubSpotEngagement>({
  id: {
    read: (from) => from("engagement.id", (v) => v.toString()),
  },
  fields: {
    type: {
      read: (from) =>
        from("engagement.type", (v) => {
          switch (v) {
            case "CALL":
              return "call";
            case "MEETING":
              return "meeting";
            case "EMAIL":
              return "email";
            case "TASK":
              return "task";
            default:
              return "note";
          }
        }),
      write: (to) =>
        to("engagement.type", (v) => {
          switch (v) {
            case "call":
              return "CALL";
            case "meeting":
              return "MEETING";
            case "email":
              return "EMAIL";
            case "task":
              return "TASK";
            default:
              return "NOTE";
          }
        }),
    },
    status: {
      read: (from) =>
        from("*", (rawHubSpotEngagement) => {
          if (rawHubSpotEngagement.engagement.type === "MEETING") {
            switch (rawHubSpotEngagement.metadata.meetingOutcome) {
              case "SCHEDULED":
                return "planned";
              case "COMPLETED":
                return "completed";
              case "RESCHEDULED":
                return "planned";
              case "NO_SHOW":
              case "CANCELED":
                return "canceled";
              default:
                return "completed";
            }
          }

          if (!rawHubSpotEngagement.metadata.status) return "completed";
          switch (rawHubSpotEngagement.metadata.status) {
            case "NOT_STARTED":
              return "planned";
            case "IN_PROGRESS":
              return "inProgress";
            case "COMPLETED":
              return "completed";
            case "WAITING":
            case "DEFERRED":
              return "canceled";
            default:
              return "completed";
          }
        }),
      write: (to) =>
        to("*", (value, crmEngagement) => {
          if (crmEngagement.type === "email") {
            switch (value) {
              case "planned":
                return {
                  metadata: {
                    meetingOutcome: "SCHEDULED" as HubSpotMeetingOutcome,
                  },
                };
              case "completed":
                return {
                  metadata: {
                    meetingOutcome: "COMPLETED" as HubSpotMeetingOutcome,
                  },
                };
              case "inProgress":
                return {
                  metadata: {
                    meetingOutcome: "RESCHEDULED" as HubSpotMeetingOutcome,
                  },
                };
              case "canceled":
                return {
                  metadata: {
                    meetingOutcome: "CANCELED" as HubSpotMeetingOutcome,
                  },
                };
              default:
                return {
                  metadata: {
                    meetingOutcome: "COMPLETED" as HubSpotMeetingOutcome,
                  },
                };
            }
          }

          switch (value) {
            case "planned":
              return {
                metadata: { status: "NOT_STARTED" as HubSpotEngagementStatus },
              };
            case "inProgress":
              return {
                metadata: { status: "IN_PROGRESS" as HubSpotEngagementStatus },
              };
            case "completed":
              return {
                metadata: { status: "COMPLETED" as HubSpotEngagementStatus },
              };
            case "canceled":
              return {
                metadata: { status: "WAITING" as HubSpotEngagementStatus },
              };
            default:
              return {
                metadata: { status: "COMPLETED" as HubSpotEngagementStatus },
              };
          }
        }),
    },
    direction: {
      read: (from) =>
        from("metadata.direction", (v) => {
          switch (v) {
            case "INBOUND":
              return "inbound";
            case "OUTBOUND":
              return "outbound";
            default:
              return undefined;
          }
        }),
      write: (to) =>
        to("metadata.direction", (v) => {
          switch (v) {
            case "inbound":
              return "INBOUND";
            case "outbound":
              return "OUTBOUND";
            default:
              return undefined;
          }
        }),
    },
    title: {
      read: (from) =>
        from("*", (rawHubSpotEngagement) => {
          switch (rawHubSpotEngagement.engagement.type) {
            case "CALL":
              return rawHubSpotEngagement.metadata.title;
            case "MEETING":
              return rawHubSpotEngagement.metadata.title;
            case "EMAIL":
              return rawHubSpotEngagement.metadata.subject;
            case "TASK":
              return rawHubSpotEngagement.metadata.subject;
            default:
              return rawHubSpotEngagement.metadata.title;
          }
        }),
      write: (to) =>
        to("*", (value, crmEngagement) => {
          switch (crmEngagement.type) {
            case "call":
            case "meeting":
            case "note":
              return { metadata: { title: value } };
            case "email":
            case "task":
              return { metadata: { subject: value } };
            default:
              return {};
          }
        }),
    },
    description: {
      read: (from) =>
        from("*", (rawHubSpotEngagement) => {
          switch (rawHubSpotEngagement.engagement.type) {
            case "CALL":
            case "MEETING":
            case "NOTE":
              return rawHubSpotEngagement.metadata.body;
            case "EMAIL":
              return rawHubSpotEngagement.metadata.html;
            case "TASK":
              return rawHubSpotEngagement.metadata.body;
            default:
              return rawHubSpotEngagement.metadata.body;
          }
        }),
      write: (to) =>
        to("*", (value, crmEngagement) => {
          switch (crmEngagement.type) {
            case "call":
            case "meeting":
            case "note":
            case "task":
              return { metadata: { body: value } };
            case "email":
              return { metadata: { text: value } };
            default:
              return {};
          }
        }),
    },
    startedAt: {
      read: (from) =>
        from("*", (rawHubSpotEngagement) => {
          const startTime = rawHubSpotEngagement.metadata.startTime;
          if (startTime) {
            return new Date(startTime).toISOString();
          }
          return new Date(
            rawHubSpotEngagement.engagement.timestamp
          ).toISOString();
        }),
      write: (to) => to("metadata.startTime", (v) => new Date(v).getTime()),
    },
    endedAt: {
      read: (from) =>
        from("metadata.endTime", (v) =>
          v ? new Date(v).toISOString() : undefined
        ),
      write: (to) => to("metadata.endTime", (v) => new Date(v).getTime()),
    },
    duration: {
      read: (from) =>
        from("metadata.durationMilliseconds", (v) => v && Math.floor(v / 1000)),
      write: (to) => to("metadata.durationMilliseconds", (v) => v * 1000),
    },
    owner: {
      read: (from) => from("engagement.ownerId", (v) => ({ id: v.toString() })),
      write: (to) => to("engagement.ownerId", (v) => parseInt(v.id)),
    },
    contacts: {
      read: (from) =>
        from("associations.contactIds", (v) =>
          v.map((id) => ({
            id: id.toString(),
          }))
        ),
      write: (to) =>
        to("associations.contactIds", (v) =>
          v.map((contact) => parseInt(contact.id))
        ),
    },
    companies: {
      read: (from) =>
        from("associations.companyIds", (v) =>
          v.map((id) => ({
            id: id.toString(),
          }))
        ),
      write: (to) =>
        to("associations.companyIds", (v) =>
          v.map((company) => parseInt(company.id))
        ),
    },
    opportunities: {
      read: (from) =>
        from("associations.dealIds", (v) =>
          v.map((id) => ({
            id: id.toString(),
          }))
        ),
      write: (to) =>
        to("associations.dealIds", (v) =>
          v.map((opportunity) => parseInt(opportunity.id))
        ),
    },
  },
  createdAt: {
    read: (from) => from("engagement.createdAt", (v) => new Date(v)),
  },
  updatedAt: {
    read: (from) => from("engagement.lastUpdated", (v) => new Date(v)),
  },
});
