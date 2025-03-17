import { ResourceModel } from "..";

const TelephonyCallTranscript = new ResourceModel({
  id: "telephonyCallTranscript",
  schema: (z) => ({
    call: z.morph
      .resource("telephonyCall")
      .optional()
      .describe("Reference to the call this transcript belongs to"),
    duration: z
      .number()
      .int()
      .min(0)
      .describe("Duration of the call in seconds"),
    segments: z
      .array(
        z.object({
          start: z.number().min(0).describe("Start time in seconds"),
          end: z.number().min(0).describe("End time in seconds"),
          text: z.string().describe("Transcribed text segment"),
          speakerId: z.string().describe("ID of the speaker"),
        })
      )
      .describe("Transcript segments with timing information"),
    speakers: z
      .array(
        z.object({
          id: z.string().describe("Unique speaker identifier"),
          origin: z
            .enum(["internal", "external", "unknown"])
            .describe(
              "Whether the speaker is internal (user), external (contact), or unknown"
            ),
          name: z.string().optional().describe("Speaker's name"),

          phone: z.string().optional().describe("Phone number of the speaker"),
          email: z
            .string()
            .email()
            .optional()
            .describe("Email address of the speaker"),
          user: z.morph
            .resource("genericUser")
            .optional()
            .describe("Reference to internal user if speaker is internal"),
          contact: z.morph
            .resource("genericContact")
            .optional()
            .describe("Reference to contact if speaker is external"),
        })
      )
      .describe("List of speakers in the transcript"),
  }),
});

export type TelephonyCallTranscript = typeof TelephonyCallTranscript;
export default TelephonyCallTranscript;
