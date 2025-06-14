/**
 * This file is auto-generated by the command "morph build" at 2025-06-04T13:04:16.150Z
 * Please do not modify it manually.
 */
import { ConnectorBundle } from "@runmorph/cdk";

import connector from "./connector";
import CrmOpportunityMapper from "./resources/crmOpportunity/mapper";
import CrmOpportunityOperationCreate from "./resources/crmOpportunity/create";
import CrmOpportunityOperationList from "./resources/crmOpportunity/list";
import CrmOpportunityOperationRetrieve from "./resources/crmOpportunity/retrieve";
import CrmOpportunityOperationUpdate from "./resources/crmOpportunity/update";
import CrmPipelineMapper from "./resources/crmPipeline/mapper";
import CrmPipelineOperationList from "./resources/crmPipeline/list";
import CrmPipelineOperationRetrieve from "./resources/crmPipeline/retrieve";
import CrmStageMapper from "./resources/crmStage/mapper";
import CrmStageOperationList from "./resources/crmStage/list";
import GenericCompanyMapper from "./resources/genericCompany/mapper";
import GenericCompanyOperationCreate from "./resources/genericCompany/create";
import GenericCompanyOperationList from "./resources/genericCompany/list";
import GenericCompanyOperationRetrieve from "./resources/genericCompany/retrieve";
import GenericCompanyOperationUpdate from "./resources/genericCompany/update";
import GenericContactMapper from "./resources/genericContact/mapper";
import GenericContactOperationCreate from "./resources/genericContact/create";
import GenericContactOperationList from "./resources/genericContact/list";
import GenericContactOperationRetrieve from "./resources/genericContact/retrieve";
import GenericContactOperationUpdate from "./resources/genericContact/update";
import GenericUserMapper from "./resources/genericUser/mapper";
import GenericUserOperationList from "./resources/genericUser/list";
import GenericUserOperationRetrieve from "./resources/genericUser/retrieve";
import GenericWorkspaceMapper from "./resources/genericWorkspace/mapper";
import GenericWorkspaceOperationRetrieve from "./resources/genericWorkspace/retrieve";
import fieldList from "./fields/list";
import fieldMapper from "./fields/mapper";

const resourceModelOperations = {
  crmOpportunity: {
  create: CrmOpportunityOperationCreate,
  list: CrmOpportunityOperationList,
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
  list: CrmStageOperationList,
  mapper: CrmStageMapper,
},
  genericCompany: {
  create: GenericCompanyOperationCreate,
  list: GenericCompanyOperationList,
  mapper: GenericCompanyMapper,
  retrieve: GenericCompanyOperationRetrieve,
  update: GenericCompanyOperationUpdate,
},
  genericContact: {
  create: GenericContactOperationCreate,
  list: GenericContactOperationList,
  mapper: GenericContactMapper,
  retrieve: GenericContactOperationRetrieve,
  update: GenericContactOperationUpdate,
},
  genericUser: {
  list: GenericUserOperationList,
  mapper: GenericUserMapper,
  retrieve: GenericUserOperationRetrieve,
},
  genericWorkspace: {
  mapper: GenericWorkspaceMapper,
  retrieve: GenericWorkspaceOperationRetrieve,
},
};



const fieldOperations = {
  mapper: fieldMapper,
  list: fieldList,
};

const connectorBundle = new ConnectorBundle({
  connector,
  resourceModelOperations,
  fieldOperations,
}).init;

export default connectorBundle;
