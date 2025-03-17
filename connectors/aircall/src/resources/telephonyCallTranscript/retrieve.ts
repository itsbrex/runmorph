import { Retrieve } from "@runmorph/cdk";

import mapper, { type AircallCallTranscript } from "./mapper";
import { AircallCall } from "../telephonyCall/mapper";

/**
 * Normalizes a phone number by removing spaces
 */
const normalizePhoneNumber = (phone: string): string =>
  phone.replace(/\s/g, "");

/**
 * Type for Aircall Contact
 */
type AircallContact = {
  id: number;
  first_name?: string;
  last_name?: string;
  phone_numbers: Array<{ value: string }>;
};

/**
 * Type for Aircall User
 */
type AircallUser = {
  id: number;
  name?: string;
};

/**
 * Type for Aircall Number
 */
type AircallNumber = {
  id: number;
  digits: string;
};

/**
 * Updates utterance data with contact information
 */
const enrichUtteranceWithContactInfo = (
  utterance: AircallCallTranscript["content"]["utterances"][0],
  contact: AircallContact,
  contactPhoneNumbers: string[]
): void => {
  if (
    utterance.participant_type === "external" &&
    utterance.phone_number &&
    contactPhoneNumbers.includes(utterance.phone_number)
  ) {
    // Add contact ID to the utterance
    utterance.contact_id = contact.id;

    // Add contact name if available
    if (contact.first_name || contact.last_name) {
      utterance.participant_name =
        `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
    }
  }
};

/**
 * Updates utterance data with user information
 */
const enrichUtteranceWithUserInfo = (
  utterance: AircallCallTranscript["content"]["utterances"][0],
  user: AircallUser | undefined,
  phoneNumber: string
): void => {
  if (utterance.participant_type === "internal") {
    // Add phone number to the utterance
    utterance.phone_number = phoneNumber;

    // Add user name if available
    if (user?.name) {
      utterance.participant_name = user.name;
    }
  }
};

export default new Retrieve({
  scopes: [],
  mapper,
  handler: async (connection, { id }) => {
    // First get the transcript
    const { data: transcriptData, error: transcriptError } =
      await connection.proxy<{
        transcription: AircallCallTranscript;
      }>({
        method: "GET",
        path: `/v1/calls/${id}/transcription`,
      });

    if (transcriptError) {
      return { error: transcriptError };
    }

    // Then get the call with contact info
    const { data: callData, error: callError } = await connection.proxy<{
      call: AircallCall;
    }>({
      method: "GET",
      path: `/v1/calls/${id}`,
      query: { fetch_contact: true },
    });

    if (callError) {
      return { error: callError };
    }

    const transcript = transcriptData.transcription;
    const call = callData.call;

    // Enrich transcript with call data if available
    if (transcript.content?.utterances?.length) {
      // Process contact information for external participants
      if (call.contact) {
        const contactPhoneNumbers = (call.contact.phone_numbers || []).map(
          (phone) => normalizePhoneNumber(phone.value)
        );

        // Enrich external utterances with contact information
        transcript.content.utterances.forEach((utterance) => {
          enrichUtteranceWithContactInfo(
            utterance,
            call.contact!,
            contactPhoneNumbers
          );
        });
      }

      // Process user information for internal participants
      if (call.number?.digits) {
        const normalizedPhoneNumber = normalizePhoneNumber(call.number.digits);

        // Enrich internal utterances with user information
        transcript.content.utterances.forEach((utterance) => {
          enrichUtteranceWithUserInfo(
            utterance,
            call.user,
            normalizedPhoneNumber
          );
        });
      }
    }

    return transcript;
  },
});
