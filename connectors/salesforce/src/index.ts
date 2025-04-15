/**
 * This file is auto-generated by the command "morph build" at 2025-04-14T13:30:51.588Z
 * Please do not modify it manually.
 */
import { ConnectorBundle } from "@runmorph/cdk";

import connector from "./connector";
import CrmOpportunityMapper from "./resources/crmOpportunity/mapper";
import CrmOpportunityOperationRetrieve from "./resources/crmOpportunity/retrieve";
import CrmOpportunityOperationUpdate from "./resources/crmOpportunity/update";
import CrmPipelineMapper from "./resources/crmPipeline/mapper";
import CrmPipelineOperationList from "./resources/crmPipeline/list";
import CrmPipelineOperationRetrieve from "./resources/crmPipeline/retrieve";
import CrmStageMapper from "./resources/crmStage/mapper";
import CrmStageOperationRetrieve from "./resources/crmStage/retrieve";
import GenericCompanyMapper from "./resources/genericCompany/mapper";
import GenericCompanyOperationRetrieve from "./resources/genericCompany/retrieve";
import GenericContactMapper from "./resources/genericContact/mapper";
import GenericContactOperationList from "./resources/genericContact/list";
import GenericContactOperationRetrieve from "./resources/genericContact/retrieve";
import GenericUserMapper from "./resources/genericUser/mapper";
import GenericUserOperationRetrieve from "./resources/genericUser/retrieve";
import GenericWorkspaceMapper from "./resources/genericWorkspace/mapper";
import GenericWorkspaceOperationRetrieve from "./resources/genericWorkspace/retrieve";
import WebhookGlobalMapper from "./webhooks/global/mapper";
import WebhookGlobalSubscribe from "./webhooks/global/subscribe";
import WebhookGlobalUnsubscribe from "./webhooks/global/unsubscribe";
import WidgetCardViewMapper from "./resources/widgetCardView/mapper";

const resourceModelOperations = {
  crmOpportunity: {
  mapper: CrmOpportunityMapper,
  retrieve: CrmOpportunityOperationRetrieve,
  update: CrmOpportunityOperationUpdate,
},
  crmPipeline: {
  list: CrmPipelineOperationList,
  mapper: CrmPipelineMapper,
  retrieve: CrmPipelineOperationRetrieve,
},
  crmStage: {
  mapper: CrmStageMapper,
  retrieve: CrmStageOperationRetrieve,
},
  genericCompany: {
  mapper: GenericCompanyMapper,
  retrieve: GenericCompanyOperationRetrieve,
},
  genericContact: {
  list: GenericContactOperationList,
  mapper: GenericContactMapper,
  retrieve: GenericContactOperationRetrieve,
},
  genericUser: {
  mapper: GenericUserMapper,
  retrieve: GenericUserOperationRetrieve,
},
  genericWorkspace: {
  mapper: GenericWorkspaceMapper,
  retrieve: GenericWorkspaceOperationRetrieve,
},
  widgetCardView: {
  mapper: WidgetCardViewMapper,
},
};


const webhookOperations = {
  global: {// eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapper: WebhookGlobalMapper as any, // CLI to refactor
  subscribe: WebhookGlobalSubscribe,
  unsubscribe: WebhookGlobalUnsubscribe,
},
};



const connectorBundle = new ConnectorBundle({
  connector,
  resourceModelOperations,
  webhookOperations,
}).init;

export default connectorBundle;
