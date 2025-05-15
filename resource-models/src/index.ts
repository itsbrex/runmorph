export * from "./ResourceModel";
export * from "./ZodExtensions";
export * from "./utils";

import { ResourceModelMap } from "./ResourceModel";
import { default as AccountingInvoice } from "./ResourceModels/AccountingInvoice";
import { default as AccountingInvoiceItem } from "./ResourceModels/AccountingInvoiceItem";
import { default as AccountingInvoiceLineItem } from "./ResourceModels/AccountingInvoiceLineItem";
import { default as CrmEngagement } from "./ResourceModels/CrmEngagement";
import { default as CrmOpportunity } from "./ResourceModels/CrmOpportunity";
import { default as CrmPipeline } from "./ResourceModels/CrmPipeline";
import { default as CrmStage } from "./ResourceModels/CrmStage";
import { default as GenericCompany } from "./ResourceModels/GenericCompany";
import { default as GenericContact } from "./ResourceModels/GenericContact";
import { default as GenericUser } from "./ResourceModels/GenericUser";
import { default as GenericWorkspace } from "./ResourceModels/GenericWorkspace";
import { default as SchedulingEvent } from "./ResourceModels/SchedulingEvent";
import { default as SchedulingEventType } from "./ResourceModels/SchedulingEventType";
import { default as SchedulingSlot } from "./ResourceModels/SchedulingSlot";
import { default as TelephonyCall } from "./ResourceModels/TelephonyCall";
import { default as TelephonyCallTranscript } from "./ResourceModels/TelephonyCallTranscript";
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
  .addResourceModel(TelephonyCall)
  .addResourceModel(TelephonyCallTranscript)
  .addResourceModel(SchedulingEventType)
  .addResourceModel(SchedulingSlot)
  .addResourceModel(SchedulingEvent)
  .addResourceModel(WidgetCardView)
  .addResourceModel(AccountingInvoice)
  .addResourceModel(AccountingInvoiceLineItem)
  .addResourceModel(AccountingInvoiceItem);

const resourceModels = resourceModelMap.getResourceModelMap();
const resourceModelIds = resourceModelMap.getResourceModelIds();
export { resourceModels, resourceModelIds };
export type ResourceModels = typeof resourceModels;
export type ResourceModelId = keyof typeof resourceModels;
