/**
 * This file is auto-generated by the command "morph build" at 2025-03-17T14:25:18.488Z
 * Please do not modify it manually.
 */
import { ConnectorBundle } from "@runmorph/cdk";

import connector from "./connector";
import GenericUserMapper from "./resources/genericUser/mapper";
import GenericUserOperationList from "./resources/genericUser/list";
import GenericUserOperationRetrieve from "./resources/genericUser/retrieve";
import TelephonyCallMapper from "./resources/telephonyCall/mapper";
import TelephonyCallOperationList from "./resources/telephonyCall/list";
import TelephonyCallOperationRetrieve from "./resources/telephonyCall/retrieve";
import TelephonyCallTranscriptMapper from "./resources/telephonyCallTranscript/mapper";
import TelephonyCallTranscriptOperationRetrieve from "./resources/telephonyCallTranscript/retrieve";
import WebhookSubscriptionMapper from "./webhooks/subscription/mapper";
import WebhookSubscriptionSubscribe from "./webhooks/subscription/subscribe";
import WebhookSubscriptionUnsubscribe from "./webhooks/subscription/unsubscribe";

const resourceModelOperations = {
  genericUser: {
  list: GenericUserOperationList,
  mapper: GenericUserMapper,
  retrieve: GenericUserOperationRetrieve,
},
  telephonyCall: {
  list: TelephonyCallOperationList,
  mapper: TelephonyCallMapper,
  retrieve: TelephonyCallOperationRetrieve,
},
  telephonyCallTranscript: {
  mapper: TelephonyCallTranscriptMapper,
  retrieve: TelephonyCallTranscriptOperationRetrieve,
},
};


const webhookOperations = {
  subscription: {// eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapper: WebhookSubscriptionMapper as any, // CLI to refactor
  subscribe: WebhookSubscriptionSubscribe,
  unsubscribe: WebhookSubscriptionUnsubscribe,
},
};


const connectorBundle = new ConnectorBundle({
  connector,
  resourceModelOperations,
  webhookOperations,
}).init;

export default connectorBundle;
