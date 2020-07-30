const commonTabs = ["general", "listeners"];
const defaultTabs = ["general"];
const variableTabs = ["general", "variables", "listeners"];

export const tabProperty = [
  {
    type: "bpmn:Process",
    subType: null || undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:StartEvent",
    subType: null || undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:EndEvent",
    subType: null || undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:ExclusiveGateway",
    subType: null || undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:EventBasedGateway",
    subType: null || undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:InclusiveGateway",
    subType: null || undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:ComplexGateway",
    subType: null || undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:ParallelGateway",
    subType: null || undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:SubProcess",
    subType: null || undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:AdHocSubProcess",
    subType: null || undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:DataObjectReference",
    subType: null || undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:DataStoreReference",
    subType: null || undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:StartEvent",
    subType: "bpmn:MessageEventDefinition",
    tabs: commonTabs,
  },
  {
    type: "bpmn:StartEvent",
    subType: "bpmn:TimerEventDefinition",
    tabs: commonTabs,
  },
  {
    type: "bpmn:StartEvent",
    subType: "bpmn:ConditionalEventDefinition",
    tabs: commonTabs,
  },
  {
    type: "bpmn:StartEvent",
    subType: "bpmn:SignalEventDefinition",
    tabs: commonTabs,
  },
  {
    type: "bpmn:EndEvent",
    subType: "bpmn:SignalEventDefinition",
    tabs: variableTabs,
  },
  {
    type: "bpmn:StartEvent",
    subType: "bpmn:IntermediateCatchEvent",
    tabs: commonTabs,
  },
  {
    type: "bpmn:IntermediateCatchEvent",
    subType: "bpmn:MessageEventDefinition",
    tabs: commonTabs,
  },
  {
    type: "bpmn:IntermediateThrowEvent",
    subType: null || undefined,
    tabs: commonTabs,
  },

  {
    type: "bpmn:IntermediateThrowEvent",
    subType: "bpmn:MessageEventDefinition",
    tabs: commonTabs,
  },
  {
    type: "bpmn:IntermediateCatchEvent",
    subType: "bpmn:TimerEventDefinition",
    tabs: commonTabs,
  },
  {
    type: "bpmn:EndEvent",
    subType: "bpmn:MessageEventDefinition",
    tabs: commonTabs,
  },
  {
    type: "bpmn:IntermediateCatchEvent",
    subType: "bpmn:ConditionalEventDefinition",
    tabs: commonTabs,
  },
  {
    type: "bpmn:IntermediateCatchEvent",
    subType: "bpmn:LinkEventDefinition",
    tabs: commonTabs,
  },
  {
    type: "bpmn:IntermediateThrowEvent",
    subType: "bpmn:LinkEventDefinition",
    tabs: defaultTabs,
  },
  {
    type: "bpmn:IntermediateThrowEvent",
    subType: "bpmn:CompensateEventDefinition",
    tabs: commonTabs,
  },
  {
    type: "bpmn:EndEvent",
    subType: "bpmn:CompensateEventDefinition",
    tabs: commonTabs,
  },
  {
    type: "bpmn:IntermediateCatchEvent",
    subType: "bpmn:SignalEventDefinition",
    tabs: commonTabs,
  },
  {
    type: "bpmn:IntermediateThrowEvent",
    subType: "bpmn:SignalEventDefinition",
    tabs: variableTabs,
  },
  {
    type: "bpmn:EndEvent",
    subType: "bpmn:ErrorEventDefinition",
    tabs: variableTabs,
  },
  {
    type: "bpmn:EndEvent",
    subType: "bpmn:TerminateEventDefinition",
    tabs: commonTabs,
  },
  {
    type: "bpmn:Participant",
    subType: null || undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:Group",
    subType: null || undefined,
    tabs: defaultTabs,
  },
  {
    type: "bpmn:Lane",
    subType: null || undefined,
    tabs: defaultTabs,
  },
  {
    type: "bpmn:Collaboration",
    subType: null || undefined,
    tabs: defaultTabs,
  },
  {
    type: "bpmn:SequenceFlow",
    subType: null || undefined,
    tabs: commonTabs,
  },

  {
    type: "bpmn:Task",
    subType: null || undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:SendTask",
    subType: null || undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:RecieveTask",
    subType: null || undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:UserTask",
    subType: null || undefined,
    tabs: ["general", "listeners", "view-attributes"],
  },
  {
    type: "bpmn:ManualTask",
    subType: null || undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:BusinessRuleTask",
    subType: null || undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:ServiceTask",
    subType: null || undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:ReceiveTask",
    subType: null || undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:ScriptTask",
    subType: null || undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:CallActivity",
    subType: null || undefined,
    tabs: variableTabs,
  },
  {
    type: "bpmn:SubProcess",
    subType: null || undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:IntermediateThrowEvent",
    subType: "bpmn:EscalationEventDefinition",
    tabs: commonTabs,
  },
  {
    type: "bpmn:EndEvent",
    subType: "bpmn:EscalationEventDefinition",
    tabs: commonTabs,
  },
  {
    type: "bpmn:TextAnnotation",
    subType: null || undefined,
    tabs: defaultTabs,
  },
];
