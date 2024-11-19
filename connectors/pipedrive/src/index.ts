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
import GenericContactMapper from "./resourceModels/genericContact/mapper";
import GenericContactOperationRetrieve from "./resourceModels/genericContact/retrieve";
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
  genericContact: {
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
};

export default new ConnectorBundle({
  connector,
  resourceModelOperations,
}).init;
