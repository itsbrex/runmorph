import { ResourceModel } from "..";

const WidgetCardViewRequest = new ResourceModel({
  id: "widgetCardViewRequest",
  schema: (z) => ({
    genericUser: z.morph
      .resource("genericUser")
      .optional()
      .describe("User that opened the widget"),
    genericContact: z.morph
      .resource("genericContact")
      .optional()
      .describe("Contact on which the widget is opened"),
    genericCompany: z.morph
      .resource("genericCompany")
      .optional()
      .describe("Company on which the widget is opened"),
    crmOpportunity: z.morph
      .resource("crmOpportunity")
      .optional()
      .describe("Opportunity on which the widget is opened"),
  }),
  response: (z) => ({
    cards: z.array(
      z.object({
        title: z.string(),
        contents: z.array(
          z.object({
            label: z.string(),
            value: z.string(),
            type: z.enum(["text", "status"]),
            color: z.string().optional(),
            link: z.string().optional(),
          })
        ),
        actions: z
          .array(
            z.object({
              label: z.string(),
              url: z.string(),
              type: z.string(),
              id: z.string().optional(),
              data: z.any().optional(),
            })
          )
          .optional(),
        link: z.string().optional(),
      })
    ),
    root: z.object({
      actions: z.array(
        z.object({
          label: z.string(),
          url: z.string(),
          type: z.string(),
          id: z.string().optional(),
          data: z.any().optional(),
        })
      ),
    }),
  }),
});

export type WidgetCardViewRequest = typeof WidgetCardViewRequest;
export default WidgetCardViewRequest;
