import { ConnectorBundle } from "@runmorph/cdk";

import connector from "./connector";
import CrmOpportunityMapper from "./resourceModels/crmOpportunity/mapper";
import CrmOpportunityOperationList from "./resourceModels/crmOpportunity/list";
import CrmOpportunityOperationRetrieve from "./resourceModels/crmOpportunity/retrieve";
import CrmOpportunityOperationUpdate from "./resourceModels/crmOpportunity/update";
import CrmPipelineMapper from "./resourceModels/crmPipeline/mapper";
import CrmPipelineOperationList from "./resourceModels/crmPipeline/list";
import CrmPipelineOperationRetrieve from "./resourceModels/crmPipeline/retrieve";
import CrmStageMapper from "./resourceModels/crmStage/mapper";
import CrmStageOperationRetrieve from "./resourceModels/crmStage/retrieve";
import GenericCompanyMapper from "./resourceModels/genericCompany/mapper";
import GenericCompanyOperationRetrieve from "./resourceModels/genericCompany/retrieve";
import GenericContactMapper from "./resourceModels/genericContact/mapper";
import GenericContactOperationCreate from "./resourceModels/genericContact/create";
import GenericContactOperationList from "./resourceModels/genericContact/list";
import GenericContactOperationRetrieve from "./resourceModels/genericContact/retrieve";
import GenericContactOperationUpdate from "./resourceModels/genericContact/update";
import GenericUserMapper from "./resourceModels/genericUser/mapper";
import GenericUserOperationRetrieve from "./resourceModels/genericUser/retrieve";
import GenericWorkspaceMapper from "./resourceModels/genericWorkspace/mapper";
import GenericWorkspaceOperationRetrieve from "./resourceModels/genericWorkspace/retrieve";

const resourceModelOperations = {
  crmOpportunity: {
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
  mapper: CrmStageMapper,
  retrieve: CrmStageOperationRetrieve,
},
  genericCompany: {
  mapper: GenericCompanyMapper,
  retrieve: GenericCompanyOperationRetrieve,
},
  genericContact: {
  create: GenericContactOperationCreate,
  list: GenericContactOperationList,
  mapper: GenericContactMapper,
  retrieve: GenericContactOperationRetrieve,
  update: GenericContactOperationUpdate,
},
  genericUser: {
  mapper: GenericUserMapper,
  retrieve: GenericUserOperationRetrieve,
},
  genericWorkspace: {
  mapper: GenericWorkspaceMapper,
  retrieve: GenericWorkspaceOperationRetrieve,
},
};

export default new ConnectorBundle({
  connector,
  resourceModelOperations,
}).init;
