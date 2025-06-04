import { DefaultFields } from "@runmorph/cdk";

export default new DefaultFields({
  metadataKeys: ["propType"],
  models: {
    genericContact: {
      address: {
        name: "Street Address",
        description:
          "Contact's street address, including apartment or unit number.",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {
          propType: "string",
        },
      },
      email: {
        name: "Email",
        description: "A contact's email address",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {
          propType: "string",
        },
      },
      firstname: {
        name: "First Name",
        description: "A contact's first name",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {
          propType: "string",
        },
      },
      lastname: {
        name: "Last Name",
        description: "A contact's last name",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {
          propType: "string",
        },
      },
      phone: {
        name: "Phone",
        description: "A contact's phone number",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {
          propType: "string",
        },
      },
    },
    organization: {
      id: {
        name: "ID",
        description: "Organization ID",
        type: "number",
        isRequired: true,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      name: {
        name: "Name",
        description: "Organization name",
        type: "text",
        isRequired: true,
        isValueReadOnly: false,
        metadata: {
          propType: "string",
        },
      },
      owner_id: {
        name: "Owner ID",
        description: "Owner ID",
        type: "number",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {
          propType: "number",
        },
      },
      next_activity_id: {
        name: "Next Activity ID",
        description: "Next activity ID",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      last_activity_id: {
        name: "Last Activity ID",
        description: "Last activity ID",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      open_deals_count: {
        name: "Open Deals Count",
        description: "Number of open deals",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      related_open_deals_count: {
        name: "Related Open Deals Count",
        description: "Number of related open deals",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      closed_deals_count: {
        name: "Closed Deals Count",
        description: "Number of closed deals",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      related_closed_deals_count: {
        name: "Related Closed Deals Count",
        description: "Number of related closed deals",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      email_messages_count: {
        name: "Email Messages Count",
        description: "Number of email messages",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      people_count: {
        name: "People Count",
        description: "Number of people",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      activities_count: {
        name: "Activities Count",
        description: "Number of activities",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      done_activities_count: {
        name: "Done Activities Count",
        description: "Number of done activities",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      undone_activities_count: {
        name: "Undone Activities Count",
        description: "Number of undone activities",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      files_count: {
        name: "Files Count",
        description: "Number of files",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      notes_count: {
        name: "Notes Count",
        description: "Number of notes",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      followers_count: {
        name: "Followers Count",
        description: "Number of followers",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      won_deals_count: {
        name: "Won Deals Count",
        description: "Number of won deals",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      related_won_deals_count: {
        name: "Related Won Deals Count",
        description: "Number of related won deals",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      lost_deals_count: {
        name: "Lost Deals Count",
        description: "Number of lost deals",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      related_lost_deals_count: {
        name: "Related Lost Deals Count",
        description: "Number of related lost deals",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
    },
    person: {
      id: {
        name: "ID",
        description: "Person ID",
        type: "number",
        isRequired: true,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      name: {
        name: "Name",
        description: "Person name",
        type: "text",
        isRequired: true,
        isValueReadOnly: false,
        metadata: {
          propType: "string",
        },
      },
      owner_id: {
        name: "Owner ID",
        description: "Owner ID",
        type: "number",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {
          propType: "number",
        },
      },
      org_id: {
        name: "Organization ID",
        description: "Organization ID",
        type: "number",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {
          propType: "number",
        },
      },
      next_activity_id: {
        name: "Next Activity ID",
        description: "Next activity ID",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      last_activity_id: {
        name: "Last Activity ID",
        description: "Last activity ID",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      open_deals_count: {
        name: "Open Deals Count",
        description: "Number of open deals",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      related_open_deals_count: {
        name: "Related Open Deals Count",
        description: "Number of related open deals",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      closed_deals_count: {
        name: "Closed Deals Count",
        description: "Number of closed deals",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      related_closed_deals_count: {
        name: "Related Closed Deals Count",
        description: "Number of related closed deals",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      participant_open_deals_count: {
        name: "Participant Open Deals Count",
        description: "Number of open deals where person is participant",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      participant_closed_deals_count: {
        name: "Participant Closed Deals Count",
        description: "Number of closed deals where person is participant",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      email_messages_count: {
        name: "Email Messages Count",
        description: "Number of email messages",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      activities_count: {
        name: "Activities Count",
        description: "Number of activities",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      done_activities_count: {
        name: "Done Activities Count",
        description: "Number of done activities",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      undone_activities_count: {
        name: "Undone Activities Count",
        description: "Number of undone activities",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      files_count: {
        name: "Files Count",
        description: "Number of files",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      notes_count: {
        name: "Notes Count",
        description: "Number of notes",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      followers_count: {
        name: "Followers Count",
        description: "Number of followers",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      won_deals_count: {
        name: "Won Deals Count",
        description: "Number of won deals",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      related_won_deals_count: {
        name: "Related Won Deals Count",
        description: "Number of related won deals",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      lost_deals_count: {
        name: "Lost Deals Count",
        description: "Number of lost deals",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      related_lost_deals_count: {
        name: "Related Lost Deals Count",
        description: "Number of related lost deals",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      last_incoming_mail_time: {
        name: "Last Incoming Mail Time",
        description: "Time of last incoming email",
        type: "datetime",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "datetime",
        },
      },
      last_outgoing_mail_time: {
        name: "Last Outgoing Mail Time",
        description: "Time of last outgoing email",
        type: "datetime",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "datetime",
        },
      },
      marketing_status: {
        name: "Marketing Status",
        description: "Marketing status",
        type: "text",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "string",
        },
      },
      doi_status: {
        name: "DOI Status",
        description: "Double opt-in status",
        type: "text",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "string",
        },
      },
    },
    deal: {
      id: {
        name: "ID",
        description: "Deal ID",
        type: "number",
        isRequired: true,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      title: {
        name: "Title",
        description: "Deal title",
        type: "text",
        isRequired: true,
        isValueReadOnly: false,
        metadata: {
          propType: "string",
        },
      },
      next_activity_id: {
        name: "Next Activity ID",
        description: "Next activity ID",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      last_activity_id: {
        name: "Last Activity ID",
        description: "Last activity ID",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      first_won_time: {
        name: "First Won Time",
        description: "Time when deal was first won",
        type: "datetime",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "datetime",
        },
      },
      products_count: {
        name: "Products Count",
        description: "Number of products",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      files_count: {
        name: "Files Count",
        description: "Number of files",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      notes_count: {
        name: "Notes Count",
        description: "Number of notes",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      followers_count: {
        name: "Followers Count",
        description: "Number of followers",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      email_messages_count: {
        name: "Email Messages Count",
        description: "Number of email messages",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      activities_count: {
        name: "Activities Count",
        description: "Number of activities",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      done_activities_count: {
        name: "Done Activities Count",
        description: "Number of done activities",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      undone_activities_count: {
        name: "Undone Activities Count",
        description: "Number of undone activities",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      participants_count: {
        name: "Participants Count",
        description: "Number of participants",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      last_incoming_mail_time: {
        name: "Last Incoming Mail Time",
        description: "Time of last incoming email",
        type: "datetime",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "datetime",
        },
      },
      last_outgoing_mail_time: {
        name: "Last Outgoing Mail Time",
        description: "Time of last outgoing email",
        type: "datetime",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "datetime",
        },
      },
      smart_bcc_email: {
        name: "Smart BCC Email",
        description: "Smart BCC email address",
        type: "text",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "string",
        },
      },
    },
  },
});
