export * from "./Model";
export * from "./ZodExtensions";

import { ModelDirectory } from "./Model";
import { default as CrmOpportunity } from "./models/CrmOpportunity";
import { default as CrmPipeline } from "./models/CrmPipeline";
import { default as CrmStage } from "./models/CrmStage";
import { default as GenericCompany } from "./models/GenericCompany";
import { default as GenericContact } from "./models/GenericContact";
import { default as GenericUser } from "./models/GenericUser";
import { default as GenericWorkspace } from "./models/GenericWorkspace";

const modelDirectory = new ModelDirectory({})
  .addModel(GenericCompany)
  .addModel(GenericContact)
  .addModel(GenericUser)
  .addModel(GenericWorkspace)
  .addModel(CrmOpportunity)
  .addModel(CrmStage)
  .addModel(CrmPipeline);

const models = modelDirectory.getModelDirectory();
const modelIds = modelDirectory.getModelIds();
export { models, modelIds };
export type Models = typeof models;
export type ModelId = keyof typeof models;
