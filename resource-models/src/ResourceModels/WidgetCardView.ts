import { ResourceModel } from "..";

const WidgetCardView = new ResourceModel({
  id: "widgetCardView",
  schema: (z) => ({
    triggeredBy: z.morph
      .resource("genericUser")
      .describe("User that opened the widget")
      .optional(),
    genericContact: z.morph
      .resource("genericContact")
      .describe("Contact on which the widget is opened")
      .optional(),
    genericCompany: z.morph
      .resource("genericCompany")
      .describe("Company on which the widget is opened")
      .optional(),
    crmOpportunity: z.morph
      .resource("crmOpportunity")
      .describe("Opportunity on which the widget is opened")
      .optional(),
  }),
  response: (z) => ({
    cards: z
      .array(
        z.object({
          title: z.string().describe("Title of the card"),
          contents: z
            .array(
              z.discriminatedUnion("type", [
                z.object({
                  type: z.literal("text").describe("Type of the content"),
                  label: z.string().describe("Label for the text content"),
                  value: z.string().describe("Text value to display"),
                  link: z
                    .string()
                    .describe("URL to open when text value clicked")
                    .optional(),
                }),
                z.object({
                  type: z.literal("status").describe("Type of the content"),
                  label: z.string().describe("Label for the status content"),
                  value: z.string().describe("Status text to display"),
                  status: z
                    .enum(["default", "success", "warning", "danger", "info"])
                    .describe("Visual style of the status"),
                }),
              ])
            )
            .describe("Array of content items to display in the card"),
          actions: z
            .array(
              z.object({
                type: z
                  .enum(["openUrl", "openUrlInIframe"])
                  .describe("Type of action"),
                label: z.string().describe("Label for the action button"),
                url: z.string().describe("URL to open when clicked"),
              })
            )
            .describe("Optional array of action buttons")
            .optional(),
          link: z
            .string()
            .describe("URL to open when the card title is clicked")
            .optional(),
        })
      )
      .describe("Array of cards to display in the widget"),
    root: z
      .object({
        title: z
          .string()
          .describe("Main title of the card view widget")
          .optional(),
        providerName: z
          .string()
          .describe("The card content's provider's name")
          .optional(),
        providerLogoUrl: z
          .string()
          .describe("URL of the provider's brand logo")
          .optional(),
        actions: z
          .array(
            z.object({
              type: z
                .enum(["openUrl", "openUrlInIframe"])
                .describe("Type of root action"),
              label: z.string().describe("Label for the root action button"),
              url: z.string().describe("URL to open when clicked"),
            })
          )
          .describe("Array of actions available at the root level")
          .optional(),
      })
      .describe("Optional root level configuration")
      .optional(),
  }),
});

export type WidgetCardViewRequest = typeof WidgetCardView;
export default WidgetCardView;
