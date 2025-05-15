import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type XeroContact = {
  ContactID: string;
  ContactStatus: string;
  Name: string;
  FirstName: string;
  LastName: string;
  CompanyNumber: string;
  EmailAddress: string;
  BankAccountDetails: string;
  TaxNumber: string;
  AccountsReceivableTaxType: string;
  AccountsPayableTaxType: string;
  Addresses: {
    AddressType: string;
    AddressLine1?: string;
    City?: string;
    PostalCode?: string;
    AttentionTo?: string;
  }[];
  Phones: {
    PhoneType: string;
    PhoneNumber?: string;
    PhoneAreaCode?: string;
    PhoneCountryCode?: string;
  }[];
  UpdatedDateUTC: string;
  IsSupplier: boolean;
  IsCustomer: boolean;
  DefaultCurrency: string;
};

export default new Mapper<ResourceModels["genericContact"], XeroContact>({
  id: {
    read: (from) => from("ContactID"),
  },
  fields: {
    firstName: {
      read: (from) => from("FirstName"),
      write: (to) => to("FirstName"),
    },
    lastName: {
      read: (from) => from("LastName"),
      write: (to) => to("LastName"),
    },
    email: {
      read: (from) => from("EmailAddress"),
      write: (to) => to("EmailAddress"),
    },
    phone: {
      read: (from) =>
        from("Phones", (phones) => {
          const defaultPhone = phones?.find((p) => p.PhoneType === "DEFAULT");
          if (!defaultPhone?.PhoneNumber) return undefined;
          return `${defaultPhone.PhoneCountryCode || ""}${defaultPhone.PhoneAreaCode || ""}${defaultPhone.PhoneNumber}`.replace(
            /\s/g,
            ""
          );
        }),
      write: (to) =>
        to("Phones", (phone) => [
          {
            PhoneType: "DEFAULT",
            PhoneNumber: phone,
          },
        ]),
    },
  },
  createdAt: {
    // Xero API doesn't provide creation date
    read: (from) =>
      from("UpdatedDateUTC", (date) => {
        if (!date) return undefined;
        // Convert Xero date format "/Date(1488391422280+0000)/" to Date
        const timestamp = parseInt(date.match(/\d+/)?.[0] || "0");
        return timestamp ? new Date(timestamp) : undefined;
      }),
  },
  updatedAt: {
    read: (from) =>
      from("UpdatedDateUTC", (date) => {
        if (!date) return undefined;
        // Convert Xero date format "/Date(1488391422280+0000)/" to Date
        const timestamp = parseInt(date.match(/\d+/)?.[0] || "0");
        return timestamp ? new Date(timestamp) : undefined;
      }),
  },
});
