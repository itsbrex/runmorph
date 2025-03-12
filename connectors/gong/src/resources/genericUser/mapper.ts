import { Mapper } from "@runmorph/cdk";
import type { ResourceModels } from "@runmorph/resource-models";

export type GongUser = {
  id: string;
  emailAddress: string;
  created: string;
  active: boolean;
  emailAliases: string[];
  trustedEmailAddress: string | null;
  firstName: string;
  lastName: string;
  title: string | null;
  phoneNumber: string | null;
  extension: string | null;
  personalMeetingUrls: string[];
  settings: {
    webConferencesRecorded: boolean;
    preventWebConferenceRecording: boolean;
    telephonyCallsImported: boolean;
    emailsImported: boolean;
    preventEmailImport: boolean;
    nonRecordedMeetingsImported: boolean;
    gongConnectEnabled: boolean;
  };
  managerId: string | null;
  meetingConsentPageUrl: string | null;
  spokenLanguages: Array<{
    language: string;
    primary: boolean;
  }>;
};

export default new Mapper<ResourceModels["genericUser"], GongUser>({
  id: {
    read: (from) => from("id"),
  },
  fields: {
    firstName: {
      read: (from) => from("firstName"),
    },
    lastName: {
      read: (from) => from("lastName"),
    },
    email: {
      read: (from) => from("emailAddress"),
    },
  },
  createdAt: {
    read: (from) =>
      from("created", (created) => (created ? new Date(created) : undefined)),
  },
  updatedAt: {
    read: (from) =>
      from("created", (created) => (created ? new Date(created) : undefined)),
  },
});
