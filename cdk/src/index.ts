//export { List, Create, Retrieve, Update, Fields, RemoteField } from './operations';
//export { Error, ErrorType, Metadata } from './operations/operation';
export { Mapper, Retrieve, RetrieveConfig } from "./operations";
export { Resource, ResourceRef, ResourceEvent } from "./resources";
export { Connector } from "./connectors";
export * from "./connectors/types";
export * from "./resource-types";

export { build } from "./cli";
