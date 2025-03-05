export * from "./ResourceModel";
export * from "./ZodExtensions";

import { ResourceModelMap } from "./ResourceModel";
import { default as CrmEngagement } from "./ResourceModels/CrmEngagement";
import { default as CrmOpportunity } from "./ResourceModels/CrmOpportunity";
import { default as CrmPipeline } from "./ResourceModels/CrmPipeline";
import { default as CrmStage } from "./ResourceModels/CrmStage";
import { default as GenericCompany } from "./ResourceModels/GenericCompany";
import { default as GenericContact } from "./ResourceModels/GenericContact";
import { default as GenericUser } from "./ResourceModels/GenericUser";
import { default as GenericWorkspace } from "./ResourceModels/GenericWorkspace";
import { default as WidgetCardView } from "./ResourceModels/WidgetCardView";

const resourceModelMap = new ResourceModelMap({})
  .addResourceModel(GenericCompany)
  .addResourceModel(GenericContact)
  .addResourceModel(GenericUser)
  .addResourceModel(GenericWorkspace)
  .addResourceModel(CrmOpportunity)
  .addResourceModel(CrmStage)
  .addResourceModel(CrmPipeline)
  .addResourceModel(CrmEngagement)
  .addResourceModel(WidgetCardView);

const resourceModels = resourceModelMap.getResourceModelMap();
const resourceModelIds = resourceModelMap.getResourceModelIds();
export { resourceModels, resourceModelIds };
export type ResourceModels = typeof resourceModels;
export type ResourceModelId = keyof typeof resourceModels;
