import asyncCapableHelper from "bpmn-js-properties-panel/lib/helper/AsyncCapableHelper";
import ImplementationTypeHelper from "bpmn-js-properties-panel/lib/helper/ImplementationTypeHelper";

import { is } from "bpmn-js/lib/util/ModelUtil";

// Require all properties you need from existing providers.
// In this case all available bpmn relevant properties without camunda extensions.
import processProps from "./parts/ProcessProps";
import idProps from "./parts/IdProps";
import nameProps from "./parts/NameProps";
import executableProps from "./parts/ExecutableProps";

// camunda properties
import versionTag from "./parts/VersionTagProps";

// job configuration
import jobConfiguration from "./parts/JobConfigurationProps";

// history time to live
import historyTimeToLive from "./parts/HistoryTimeToLiveProps";

// candidate starter groups/users
import candidateStarter from "./parts/CandidateStarterProps";

// tasklist
import tasklist from "./parts/TasklistProps";

// external task configuration
import externalTaskConfiguration from "./parts/ExternalTaskConfigurationProps";

import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import eventDefinitionHelper from "bpmn-js-properties-panel/lib/helper/EventDefinitionHelper";
import {
  CallActivityProps,
  ConditionalProps,
  EventProps,
  LinkProps,
  ScriptProps,
  ServiceTaskDelegateProps,
  StartEventInitiator,
  ListenerProps,
  VariableMapping,
  MultiInstanceProps,
  UserTaskProps,
  ModelProps,
} from "./parts/CustomImplementation";

import ViewAttributePanel from "../views/ViewAttributePanel";
import TimeEmailPanel from "../views/TimeEmailPanel";
// helpers

let isExternalTaskPriorityEnabled = function (element) {
  let businessObject = getBusinessObject(element);

  // show only if element is a process, a participant ...
  if (
    is(element, "bpmn:Process") ||
    (is(element, "bpmn:Participant") && businessObject.get("processRef"))
  ) {
    return true;
  }

  let externalBo = ImplementationTypeHelper.getServiceTaskLikeBusinessObject(
      element
    ),
    isExternalTask =
      ImplementationTypeHelper.getImplementationType(externalBo) === "external";

  // ... or an external task with selected external implementation type
  return (
    !!ImplementationTypeHelper.isExternalCapable(externalBo) && isExternalTask
  );
};

let isJobConfigEnabled = function (element) {
  let businessObject = getBusinessObject(element);

  if (
    is(element, "bpmn:Process") ||
    (is(element, "bpmn:Participant") && businessObject.get("processRef"))
  ) {
    return true;
  }

  // async behavior
  let bo = getBusinessObject(element);
  if (
    asyncCapableHelper.isAsyncBefore(bo) ||
    asyncCapableHelper.isAsyncAfter(bo)
  ) {
    return true;
  }

  // timer definition
  if (is(element, "bpmn:Event")) {
    return !!eventDefinitionHelper.getTimerEventDefinition(element);
  }

  return false;
};

let PROCESS_KEY_HINT = "This maps to the process definition key.";
let TASK_KEY_HINT = "This maps to the task definition key.";

function createGeneralTabGroups(
  element,
  canvas,
  bpmnFactory,
  elementRegistry,
  elementTemplates,
  translate,
  bpmnModeler
) {
  // refer to target element for external labels
  element = element && (element.labelTarget || element);

  let generalGroup = {
    id: "general",
    label: translate("General"),
    entries: [],
  };

  let idOptions;
  let processOptions;

  if (is(element, "bpmn:Process")) {
    idOptions = { description: PROCESS_KEY_HINT };
  }

  if (is(element, "bpmn:UserTask")) {
    idOptions = { description: TASK_KEY_HINT };
  }

  if (is(element, "bpmn:Participant")) {
    processOptions = { processIdDescription: PROCESS_KEY_HINT };
  }

  idProps(generalGroup, element, translate, idOptions);
  nameProps(generalGroup, element, bpmnFactory, canvas, translate, bpmnModeler);
  processProps(generalGroup, element, translate, processOptions);
  versionTag(generalGroup, element, translate);
  executableProps(generalGroup, element, translate);

  let userTaskProps = {
    id: "userTaskProps",
    label: translate("Details"),
    entries: [],
    component: UserTaskProps,
  };

  let serviceTaskDelegateProps = {
    id: "serviceTaskDelegateProps",
    label: translate("Details"),
    entries: [],
    component: ServiceTaskDelegateProps,
  };

  let scriptProps = {
    id: "scriptProps",
    label: translate("Details"),
    entries: [],
    component: ScriptProps,
  };

  let linkProps = {
    id: "linkProps",
    label: translate("Details"),
    entries: [],
    component: LinkProps,
  };

  let callActivityProps = {
    id: "callActivityProps",
    label: translate("Details"),
    entries: [],
    component: CallActivityProps,
  };

  let eventProps = {
    id: "eventProps",
    label: translate("Details"),
    entries: [],
    component: EventProps,
  };

  let conditionalProps = {
    id: "conditionalProps",
    label: translate("Details"),
    entries: [],
    component: ConditionalProps,
  };
  let startEventInitiator = {
    id: "startEventInitiator",
    label: translate("Details"),
    entries: [],
    component: StartEventInitiator,
  };

  let modelProps = {
    id: "modelProps",
    label: translate("Details"),
    entries: [],
    component: ModelProps,
  };

  let multiInstanceGroup = {
    id: "multiInstance",
    label: translate("Multi Instance"),
    entries: [],
    component: MultiInstanceProps,
  };

  let jobConfigurationGroup = {
    id: "jobConfiguration",
    label: translate("Job Configuration"),
    entries: [],
    enabled: isJobConfigEnabled,
  };
  jobConfiguration(jobConfigurationGroup, element, bpmnFactory, translate);

  let externalTaskGroup = {
    id: "externalTaskConfiguration",
    label: translate("External Task Configuration"),
    entries: [],
    enabled: isExternalTaskPriorityEnabled,
  };
  externalTaskConfiguration(externalTaskGroup, element, bpmnFactory, translate);

  let candidateStarterGroup = {
    id: "candidateStarterConfiguration",
    label: translate("Candidate Starter Configuration"),
    entries: [],
  };
  candidateStarter(candidateStarterGroup, element, bpmnFactory, translate);

  let historyTimeToLiveGroup = {
    id: "historyConfiguration",
    label: translate("History Configuration"),
    entries: [],
  };
  historyTimeToLive(historyTimeToLiveGroup, element, bpmnFactory, translate);

  let tasklistGroup = {
    id: "tasklist",
    label: translate("Tasklist Configuration"),
    entries: [],
  };
  tasklist(tasklistGroup, element, bpmnFactory, translate);

  let groups = [];
  groups.push(generalGroup);
  groups.push(userTaskProps);
  groups.push(serviceTaskDelegateProps);
  groups.push(scriptProps);
  groups.push(linkProps);
  groups.push(callActivityProps);
  groups.push(eventProps);
  // groups.push(errorProps);
  groups.push(conditionalProps);
  groups.push(startEventInitiator);
  groups.push(modelProps);
  // groups.push(detailsGroup);
  groups.push(multiInstanceGroup);

  if (element.type !== "bpmn:Process") {
    groups.push(externalTaskGroup);
    groups.push(jobConfigurationGroup);
    groups.push(candidateStarterGroup);
    groups.push(historyTimeToLiveGroup);
    groups.push(tasklistGroup);
  }
  return groups;
}

function createVariablesTabGroups(
  element,
  bpmnFactory,
  elementRegistry,
  translate
) {
  let variablesGroup = {
    id: "variables",
    label: translate("Variables"),
    entries: [],
    component: VariableMapping,
  };
  return [variablesGroup];
}

function createListenersTabGroups(
  element,
  bpmnFactory,
  elementRegistry,
  translate
) {
  let listenersGroup = {
    id: "listeners",
    label: translate("Listeners"),
    entries: [],
    component: ListenerProps,
  };
  return [listenersGroup];
}

function createViewAttributsGroups(
  element,
  bpmnFactory,
  elementRegistry,
  translate
) {
  let viewAttributesGroup = {
    id: "view-attributes",
    label: translate("View Attributes"),
    entries: [],
    component: ViewAttributePanel,
  };
  return [viewAttributesGroup];
}

function createTimeEmailGroups(
  element,
  bpmnFactory,
  elementRegistry,
  translate
) {
  let timeEmailGroup = {
    id: "time-email-tab",
    label: translate("Time/Email"),
    entries: [],
    component: TimeEmailPanel,
  };
  return [timeEmailGroup];
}

export default function getTabs(
  element,
  canvas,
  bpmnFactory,
  elementRegistry,
  elementTemplates,
  translate,
  bpmnModeler
) {
  let generalTab = {
    id: "general",
    label: translate("General"),
    groups: createGeneralTabGroups(
      element,
      canvas,
      bpmnFactory,
      elementRegistry,
      elementTemplates,
      translate,
      bpmnModeler
    ),
  };

  let variablesTab = {
    id: "variables",
    label: translate("Variables"),
    groups: createVariablesTabGroups(
      element,
      bpmnFactory,
      elementRegistry,
      translate
    ),
  };

  let listenersTab = {
    id: "listeners",
    label: translate("Listeners"),
    groups: createListenersTabGroups(
      element,
      bpmnFactory,
      elementRegistry,
      translate
    ),
  };

  let viewAttributesTab = {
    id: "view-attributes",
    label: translate("View Attributes"),
    groups: createViewAttributsGroups(
      element,
      bpmnFactory,
      elementRegistry,
      translate
    ),
  };

  let timeEmailTab = {
    id: "time-email-tab",
    label: translate("Time/Email"),
    groups: createTimeEmailGroups(
      element,
      bpmnFactory,
      elementRegistry,
      translate
    ),
  };

  let tabs = [
    generalTab,
    viewAttributesTab,
    variablesTab,
    timeEmailTab,
    listenersTab,
  ];
  return tabs;
}
