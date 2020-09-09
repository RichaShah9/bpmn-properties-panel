const commonTabs = ["general", "menu-action-tab", "listeners"];
const defaultTabs = ["general", "menu-action-tab"];
const variableTabs = ["general", "variables", "menu-action-tab", "listeners"];
const commonTabsWithoutMenuAction = ["general", "listeners"];
const defaultTabsWithoutMenuAction = ["general"];
const variableTabsWithoutMenuAction = ["general", "variables", "listeners"];

export const tabProperty = [
  {
    type: "bpmn:Process",
    subType: null || undefined,
    tabs: ["general", "configuration", "listeners"],
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
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:EventBasedGateway",
    subType: null || undefined,
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:InclusiveGateway",
    subType: null || undefined,
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:ComplexGateway",
    subType: null || undefined,
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:ParallelGateway",
    subType: null || undefined,
    tabs: commonTabsWithoutMenuAction,
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
    tabs: commonTabsWithoutMenuAction,
  },

  {
    type: "bpmn:IntermediateThrowEvent",
    subType: "bpmn:MessageEventDefinition",
    tabs: commonTabsWithoutMenuAction,
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
    tabs: defaultTabsWithoutMenuAction,
  },
  {
    type: "bpmn:IntermediateThrowEvent",
    subType: "bpmn:CompensateEventDefinition",
    tabs: commonTabsWithoutMenuAction,
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
    tabs: variableTabsWithoutMenuAction,
  },
  {
    type: "bpmn:EndEvent",
    subType: "bpmn:ErrorEventDefinition",
    tabs: commonTabs,
  },
  {
    type: "bpmn:EndEvent",
    subType: "bpmn:TerminateEventDefinition",
    tabs: commonTabs,
  },
  {
    type: "bpmn:Participant",
    subType: null || undefined,
    tabs: ["general", "configuration", "listeners"],
  },
  {
    type: "bpmn:Group",
    subType: null || undefined,
    tabs: defaultTabs,
  },
  {
    type: "bpmn:Lane",
    subType: null || undefined,
    tabs: defaultTabsWithoutMenuAction,
  },
  {
    type: "bpmn:Collaboration",
    subType: null || undefined,
    tabs: defaultTabsWithoutMenuAction,
  },
  {
    type: "bpmn:SequenceFlow",
    subType: null || undefined,
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:MessageFlow",
    subType: null || undefined,
    tabs: defaultTabsWithoutMenuAction,
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
    tabs: ["general", "listeners", "view-attributes", "menu-action-tab"],
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
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:EndEvent",
    subType: "bpmn:EscalationEventDefinition",
    tabs: commonTabs,
  },
  {
    type: "bpmn:TextAnnotation",
    subType: null || undefined,
    tabs: defaultTabsWithoutMenuAction,
  },
  {
    type: "bpmn:Association",
    subType: null || undefined,
    tabs: defaultTabs,
  },
  {
    type: "bpmn:Transaction",
    subType: null || undefined,
    tabs: commonTabs,
  },
  {
    type: "bpmn:BoundaryEvent",
    subType: null || undefined,
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:BoundaryEvent",
    subType: "bpmn:MessageEventDefinition",
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:BoundaryEvent",
    subType: "bpmn:TimerEventDefinition",
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:BoundaryEvent",
    subType: "bpmn:EscalationEventDefinition",
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:BoundaryEvent",
    subType: "bpmn:ConditionalEventDefinition",
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:BoundaryEvent",
    subType: "bpmn:ErrorEventDefinition",
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:BoundaryEvent",
    subType: "bpmn:CancelEventDefinition",
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:BoundaryEvent",
    subType: "bpmn:SignalEventDefinition",
    tabs: commonTabsWithoutMenuAction,
  },
  {
    type: "bpmn:BoundaryEvent",
    subType: "bpmn:CompensateEventDefinition",
    tabs: commonTabsWithoutMenuAction,
  },
];
