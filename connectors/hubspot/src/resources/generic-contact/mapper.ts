import { Mapper, GenericContact } from "@runmorph/cdk";

export type HubSpotContact = {
  id: string;
  properties: {
    FirstName: string;
    LastName: string;
    Fullname: string;
    Role: string;
    Email: Array<{ value: string }>;
    Tags: string[];
    Phone: string;
  };
  createdAt: string;
  updatedAt: string;
};

export default new Mapper<GenericContact, HubSpotContact>({
  id: {
    path: "id",
  },
  data: {
    firstName: {
      path: "properties.FirstName",
      field: "FirstName",
    },
    lastName: {
      path: "properties.LastName",
      field: "LastName",
    },
    email: {
      path: "properties.Email",
      read: (path_value, _remote_value) => path_value[0].value,
    },
    phone: {
      path: "properties.Phone",
    },
  },
  created_at: {
    path: "createdAt",
  },
  updated_at: {
    path: "updatedAt",
  },
});
