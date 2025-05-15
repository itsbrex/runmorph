import { DefaultFields } from "@runmorph/cdk";

export default new DefaultFields({
  models: {
    genericContact: {
      id: {
        name: "ID",
        description:
          "Id for the new customer. If not given, this will be auto-generated.",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {},
      },
      first_name: {
        name: "First Name",
        description: "First name of the customer.",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {},
      },
      last_name: {
        name: "Last Name",
        description: "Last name of the customer.",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {},
      },
      email: {
        name: "Email",
        description:
          "Email of the customer. Configured email notifications will be sent to this email.",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {},
      },
      phone: {
        name: "Phone",
        description: "Phone number of the customer.",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {},
      },
      company: {
        name: "Company",
        description: "Company name of the customer.",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {},
      },
      preferred_currency_code: {
        name: "Preferred Currency Code",
        description:
          "The currency code (ISO 4217 format) of the customer. Applicable if Multicurrency is enabled.",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {},
      },
      auto_collection: {
        name: "Auto Collection",
        description:
          "Whether payments needs to be collected automatically for this customer.",
        type: "select",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {},
        optionSource: "static",
        options: [
          {
            name: "On - Automatic charge attempts",
            value: "on",
          },
          {
            name: "Off - Manual payment recording",
            value: "off",
          },
        ],
      },
      net_term_days: {
        name: "Net Term Days",
        description:
          "The number of days within which the customer has to make payment for the invoice.",
        type: "number",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {},
      },
      allow_direct_debit: {
        name: "Allow Direct Debit",
        description: "Whether the customer can pay via Direct Debit.",
        type: "boolean",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {},
      },
      vat_number: {
        name: "VAT Number",
        description: "The VAT/tax registration number for the customer.",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {},
      },
      vat_number_prefix: {
        name: "VAT Number Prefix",
        description:
          "An overridden value for the first two characters of the full VAT number.",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {},
      },
      entity_identifier_scheme: {
        name: "Entity Identifier Scheme",
        description:
          "The Peppol BIS scheme associated with the vat_number of the customer.",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {},
      },
      entity_identifier_standard: {
        name: "Entity Identifier Standard",
        description:
          "The standard used for specifying the entity_identifier_scheme.",
        type: "text",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {},
      },
      registered_for_gst: {
        name: "Registered for GST",
        description: "Confirms that a customer is registered under GST.",
        type: "boolean",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {},
      },
      is_einvoice_enabled: {
        name: "Is E-Invoice Enabled",
        description: "Determines whether the customer is e-invoiced.",
        type: "boolean",
        isRequired: false,
        isValueReadOnly: false,
        metadata: {},
      },
      einvoicing_method: {
        name: "E-Invoicing Method",
        description:
          "Determines whether to send an e-invoice manually or automatic.",
        type: "select",
        isRequired: false,
        isValueReadOnly: false,
        optionSource: "static",
        options: [
          {
            name: "Automatic",
            value: "automatic",
          },
          {
            name: "Manual",
            value: "manual",
          },
          {
            name: "Site Default",
            value: "site_default",
          },
        ],
        metadata: {},
        taxability: {
          name: "Taxability",
          description: "Specifies if the customer is liable for tax.",
          type: "select",
          isRequired: false,
          isValueReadOnly: false,
          metadata: {
            options: [
              {
                label: "Taxable",
                value: "taxable",
              },
              {
                label: "Exempt",
                value: "exempt",
              },
            ],
          },
        },
        customer_type: {
          name: "Customer Type",
          description: "Indicates the type of the customer.",
          type: "select",
          isRequired: false,
          isValueReadOnly: false,
          metadata: {
            options: [
              {
                label: "Residential",
                value: "residential",
              },
              {
                label: "Business",
                value: "business",
              },
              {
                label: "Senior Citizen",
                value: "senior_citizen",
              },
              {
                label: "Industrial",
                value: "industrial",
              },
            ],
          },
        },
        client_profile_id: {
          name: "Client Profile ID",
          description: "Indicates the Client profile id for the customer.",
          type: "text",
          isRequired: false,
          isValueReadOnly: false,
          metadata: {},
        },
        taxjar_exemption_category: {
          name: "TaxJar Exemption Category",
          description: "Indicates the exemption type of the customer.",
          type: "select",
          isRequired: false,
          isValueReadOnly: false,
          optionSource: "static",
          options: [
            {
              name: "Wholesale",
              value: "wholesale",
            },
            {
              name: "Government",
              value: "government",
            },
            {
              name: "Other",
              value: "other",
            },
          ],
          metadata: {},
        },
        business_customer_without_vat_number: {
          name: "Business Customer Without VAT Number",
          description:
            "Confirms that a customer is a valid business without an EU/UK VAT number.",
          type: "boolean",
          isRequired: false,
          isValueReadOnly: false,
          metadata: {},
        },
        locale: {
          name: "Locale",
          description:
            "Determines which region-specific language Chargebee uses to communicate with the customer.",
          type: "text",
          isRequired: false,
          isValueReadOnly: false,
          metadata: {},
        },
        offline_payment_method: {
          name: "Offline Payment Method",
          description: "The preferred offline payment method for the customer.",
          type: "select",
          isRequired: false,
          isValueReadOnly: false,
          optionSource: "static",
          options: [
            {
              name: "No Preference",
              value: "no_preference",
            },
            {
              name: "Cash",
              value: "cash",
            },
            {
              name: "Check",
              value: "check",
            },
            {
              name: "Bank Transfer",
              value: "bank_transfer",
            },
          ],
          metadata: {},
        },
        auto_close_invoices: {
          name: "Auto Close Invoices",
          description:
            "Override for this customer, the site-level setting for auto-closing invoices.",
          type: "boolean",
          isRequired: false,
          isValueReadOnly: false,
          metadata: {},
        },
        consolidated_invoicing: {
          name: "Consolidated Invoicing",
          description:
            "Indicates whether invoices raised on the same day for the customer are consolidated.",
          type: "boolean",
          isRequired: false,
          isValueReadOnly: false,
          metadata: {},
        },
        token_id: {
          name: "Token ID",
          description: "The Chargebee payment token generated by Chargebee JS.",
          type: "text",
          isRequired: false,
          isValueReadOnly: false,
          metadata: {},
        },
        business_entity_id: {
          name: "Business Entity ID",
          description:
            "The unique ID of the business entity this customer should be linked to.",
          type: "text",
          isRequired: false,
          isValueReadOnly: false,
          metadata: {},
        },
        invoice_notes: {
          name: "Invoice Notes",
          description:
            "A customer-facing note added to all invoices associated with this API resource.",
          type: "text",
          isRequired: false,
          isValueReadOnly: false,
          metadata: {},
        },
      },
    },
  },
});
