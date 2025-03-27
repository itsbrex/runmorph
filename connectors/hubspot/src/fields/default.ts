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
      annualrevenue: {
        name: "Annual Revenue",
        description: "Annual company revenue",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {
          propType: "string",
        },
      },
      associatedcompanyid: {
        name: "Primary Associated Company ID",
        description:
          "HubSpot defined ID of a contact's primary associated company in HubSpot.",
        type: "number",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {
          propType: "number",
        },
      },
      associatedcompanylastupdated: {
        name: "Associated Company Last Updated",
        description:
          "This field is meaningless on its own, and is solely used for triggering dynamic list updates when a company is updated",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      city: {
        name: "City",
        description: "A contact's city of residence",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {
          propType: "string",
        },
      },
      closedate: {
        name: "Close Date",
        description:
          "Date the contact became a customer. Set automatically when a deal or opportunity is marked as closed-won. It can also be set manually or programmatically.",
        type: "datetime",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {
          propType: "datetime",
        },
      },
      company: {
        name: "Company Name",
        description:
          "Name of the contact's company. This can be set independently from the name property on the contact's associated company.",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {
          propType: "string",
        },
      },
      company_size: {
        name: "Company size",
        description:
          "Contact's company size. Required for the Facebook Ads Integration. Automatically synced from the Lead Ads tool.",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {
          propType: "string",
        },
      },
      country: {
        name: "Country/Region",
        description:
          "The contact's country/region of residence. This might be set via import, form, or integration.",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {
          propType: "string",
        },
      },
      createdate: {
        name: "Create Date",
        description: "The date that a contact entered the system",
        type: "datetime",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "datetime",
        },
      },
      currentlyinworkflow: {
        name: "Currently in workflow (to be discontinued on April 18)",
        description: "True when contact is enrolled in a workflow.",
        type: "select",
        optionSource: "static",
        options: [
          { value: "true", name: "True" },
          { value: "false", name: "False" },
        ],
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "enumeration",
        },
      },
      date_of_birth: {
        name: "Date of birth",
        description:
          "Contact's date of birth. Required for the Facebook Ads Integration. Automatically synced from the Lead Ads tool.",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {
          propType: "string",
        },
      },
      days_to_close: {
        name: "Days To Close",
        description:
          "Count of days elapsed between creation and being closed as a customer. Set automatically.",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      degree: {
        name: "Degree",
        description:
          "Contact's degree. Required for the Facebook Ads Integration. Automatically synced from the Lead Ads tool.",
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
      engagements_last_meeting_booked: {
        name: "Date of last meeting booked in meetings tool",
        description:
          "The date of the last meeting that has been scheduled by a contact through the meetings tool. If multiple meetings have been scheduled, the date of the last chronological meeting in the timeline is shown.",
        type: "datetime",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "datetime",
        },
      },
      engagements_last_meeting_booked_campaign: {
        name: "Campaign of last booking in meetings tool",
        description:
          "UTM parameter for marketing campaign (e.g. a specific email) responsible for recent meeting booking. Only populated when tracking parameters are included in meeting link.",
        type: "text",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "string",
        },
      },
      engagements_last_meeting_booked_medium: {
        name: "Medium of last booking in meetings tool",
        description:
          "UTM parameter for the channel (e.g. email) responsible for most recent meeting booking. Only populated when tracking parameters are included in meeting link.",
        type: "text",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "string",
        },
      },
      engagements_last_meeting_booked_source: {
        name: "Source of last booking in meetings tool",
        description:
          "UTM parameter for the site (e.g. Twitter) responsible for most recent meeting booking. Only populated when tracking parameters are included in meeting link.",
        type: "text",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "string",
        },
      },
      fax: {
        name: "Fax Number",
        description: "A contact's primary fax number",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {
          propType: "string",
        },
      },
      field_of_study: {
        name: "Field of study",
        description:
          "Contact's field of study. Required for the Facebook Ads Integration. Automatically synced from the Lead Ads tool.",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {
          propType: "string",
        },
      },
      first_conversion_date: {
        name: "First Conversion Date",
        description: "Date this contact first submitted a form.",
        type: "datetime",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "datetime",
        },
      },
      first_conversion_event_name: {
        name: "First Conversion",
        description: "First form this contact submitted.",
        type: "text",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "string",
        },
      },
      first_deal_created_date: {
        name: "First Deal Created Date",
        description:
          "Date first deal was created for contact. Set automatically.",
        type: "datetime",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "datetime",
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
      followercount: {
        name: "Follower Count",
        description: "The number of Twitter followers a contact has",
        type: "number",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {
          propType: "number",
        },
      },
      gender: {
        name: "Gender",
        description:
          "Contact's gender. Required for the Facebook Ads Integration. Automatically synced from the Lead Ads tool.",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {
          propType: "string",
        },
      },
      graduation_date: {
        name: "Graduation date",
        description:
          "Contact's graduation date. Required for the Facebook Ads Integration. Automatically synced from the Lead Ads tool.",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {
          propType: "string",
        },
      },
      hs_additional_emails: {
        name: "Additional email addresses",
        description: "A set of additional email addresses for a contact",
        type: "select",
        optionSource: "static",
        options: [],
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "enumeration",
        },
      },
      hs_all_accessible_team_ids: {
        name: "All teams",
        description:
          "The team IDs, including the team hierarchy, of all default and custom owner properties for this record.",
        type: "select",
        optionSource: "static",
        options: [],
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "enumeration",
        },
      },
      hs_all_assigned_business_unit_ids: {
        name: "Business units",
        description: "The business units this record is assigned to.",
        type: "select",
        optionSource: "static",
        options: [],
        isRequired: false,
        isValueReadOnly: false,
        metadata: {
          propType: "enumeration",
        },
      },
      hs_all_contact_vids: {
        name: "All vids for a contact",
        description: "A set of all vids, canonical or otherwise, for a contact",
        type: "select",
        optionSource: "static",
        options: [],
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "enumeration",
        },
      },
      hs_all_owner_ids: {
        name: "All owner IDs",
        description:
          "Values of all default and custom owner properties for this record.",
        type: "select",
        optionSource: "static",
        options: [],
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "enumeration",
        },
      },
      hs_all_team_ids: {
        name: "All team IDs",
        description:
          "The team IDs of all default and custom owner properties for this record.",
        type: "select",
        optionSource: "static",
        options: [],
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "enumeration",
        },
      },
      hs_analytics_average_page_views: {
        name: "Average Pageviews",
        description:
          "Average number of pageviews per session for this contact. Set automatically.",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      hs_analytics_first_referrer: {
        name: "First Referring Site",
        description:
          "URL that referred the contact to your website. Set automatically.",
        type: "text",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "string",
        },
      },
      hs_analytics_first_timestamp: {
        name: "Time First Seen",
        description: "First time the contact has been seen. Set automatically.",
        type: "datetime",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "datetime",
        },
      },
      hs_analytics_first_touch_converting_campaign: {
        name: "First Touch Converting Campaign",
        description:
          "Campaign responsible for the first touch creation of this contact.",
        type: "text",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "string",
        },
      },
      hs_analytics_first_url: {
        name: "First Page Seen",
        description:
          "First page the contact visited on your website. Set automatically.",
        type: "text",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "string",
        },
      },
      hs_analytics_first_visit_timestamp: {
        name: "Time of First Session",
        description:
          "First time the contact visited your website. Set automatically.",
        type: "datetime",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "datetime",
        },
      },
      hs_analytics_last_referrer: {
        name: "Last Referring Site",
        description:
          "Last URL that referred contact to your website. Set automatically.",
        type: "text",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "string",
        },
      },
      hs_analytics_last_timestamp: {
        name: "Time Last Seen",
        description: "Timestamp for most recent webpage view on your website.",
        type: "datetime",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "datetime",
        },
      },
      hs_analytics_last_touch_converting_campaign: {
        name: "Last Touch Converting Campaign",
        description:
          "Campaign responsible for the last touch creation of this contact.",
        type: "text",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "string",
        },
      },
      hs_analytics_last_url: {
        name: "Last Page Seen",
        description:
          "Last page the contact visited on your website. Set automatically.",
        type: "text",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "string",
        },
      },
      hs_analytics_last_visit_timestamp: {
        name: "Time of Last Session",
        description:
          "Timestamp for start of the most recent session for this contact to your website.",
        type: "datetime",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "datetime",
        },
      },
      hs_analytics_num_event_completions: {
        name: "Number of event completions",
        description:
          "Total number of events for this contact. Set automatically.",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      hs_analytics_num_page_views: {
        name: "Number of Pageviews",
        description:
          "Total number of page views this contact has had on your website. Set automatically.",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      hs_analytics_num_visits: {
        name: "Number of Sessions",
        description:
          "Number of times a contact has come to your website. Set automatically.",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      hs_analytics_revenue: {
        name: "Event Revenue",
        description:
          "Set event revenue on a contact though the Enterprise Events feature. http://help.hubspot.com/articles/KCS_Article/Reports/How-do-I-create-Events-in-HubSpot",
        type: "number",
        isRequired: false,
        isValueReadOnly: true,
        metadata: {
          propType: "number",
        },
      },
      hs_seniority: {
        name: "Employment Seniority",
        description: "Job Seniority",
        type: "select",
        optionSource: "static",
        options: [
          { value: "vp", name: "VP" },
          { value: "director", name: "Director" },
          { value: "entry", name: "Entry" },
          { value: "executive", name: "Executive" },
          { value: "manager", name: "Manager" },
          { value: "owner", name: "Owner" },
          { value: "partner", name: "Partner" },
          { value: "senior", name: "Senior" },
          { value: "employee", name: "Employee" },
        ],
        isRequired: false,
        isValueReadOnly: false,
        metadata: {
          propType: "enumeration",
        },
      },
    },
    crmEngagement: {
      foo_bar: {
        name: "Foo Bar",
        description: "The foo bar of the contact",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {
          foo: "foo",
          bar: "bar",
        },
      },
    },
    genericCompany: {
      name: {
        name: "Name",
        description: "The name of the company",
        type: "select",
        optionSource: "static",
        options: [
          { value: "1", name: "1" },
          { value: "2", name: "2" },
          { value: "3", name: "3" },
        ],
        isRequired: true,
        isValueReadOnly: true,
        metadata: {},
      },
    },
  },
});
