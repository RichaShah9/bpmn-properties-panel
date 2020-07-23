import asyncCapableHelper from "bpmn-js-properties-panel/lib/helper/AsyncCapableHelper";
import ImplementationTypeHelper from "bpmn-js-properties-panel/lib/helper/ImplementationTypeHelper";

import { is } from "bpmn-js/lib/util/ModelUtil";

// Require all properties you need from existing providers.
// In this case all available bpmn relevant properties without camunda extensions.
import processProps from "./parts/ProcessProps";
import eventProps from "./parts/EventProps";
import linkProps from "./parts/LinkProps";
import idProps from "./parts/IdProps";
import nameProps from "./parts/NameProps";
import executableProps from "./parts/ExecutableProps";

// camunda properties
import serviceTaskDelegateProps from "./parts/ServiceTaskDelegateProps";
import callActivityProps from "./parts/CallActivityProps";
import multiInstanceProps from "./parts/MultiInstanceLoopProps";
import conditionalProps from "./parts/ConditionalProps";
import scriptProps from "./parts/ScriptTaskProps";
import errorProps from "./parts/ErrorEventProps";
import formProps from "./parts/FormProps";
import startEventInitiator from "./parts/StartEventInitiator";
import variableMapping from "./parts/VariableMappingProps";
import versionTag from "./parts/VersionTagProps";

import listenerProps from "./parts/ListenerProps";
import listenerDetails from "./parts/ListenerDetailProps";
import listenerFields from "./parts/ListenerFieldInjectionProps";

import elementTemplateChooserProps from "bpmn-js-properties-panel/lib/provider/camunda/element-templates/parts/ChooserProps";
import elementTemplateCustomProps from "./parts/CustomProps";

// Connector
import connectorDetails from "./parts/ConnectorDetailProps";
import connectorInputOutput from "./parts/ConnectorInputOutputProps";
import connectorInputOutputParameter from "./parts/ConnectorInputOutputParameterProps";

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

// field injection
import fieldInjections from "./parts/FieldInjectionProps";

import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import eventDefinitionHelper from "bpmn-js-properties-panel/lib/helper/EventDefinitionHelper";
import implementationTypeHelper from "bpmn-js-properties-panel/lib/helper/ImplementationTypeHelper";

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

let getInputOutputParameterLabel = function (param, translate) {
  if (is(param, "camunda:InputParameter")) {
    return translate("Input Parameter");
  }

  if (is(param, "camunda:OutputParameter")) {
    return translate("Output Parameter");
  }

  return "";
};

let getListenerLabel = function (param, translate) {
  if (is(param, "camunda:ExecutionListener")) {
    return translate("Execution Listener");
  }

  if (is(param, "camunda:TaskListener")) {
    return translate("Task Listener");
  }

  return "";
};

let PROCESS_KEY_HINT = "This maps to the process definition key.";
let TASK_KEY_HINT = "This maps to the task definition key.";

function createGeneralTabGroups(
  element,
  canvas,
  bpmnFactory,
  elementRegistry,
  elementTemplates,
  translate
) {
  // refer to target element for external labels
  element = element.labelTarget || element;

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
  nameProps(generalGroup, element, bpmnFactory, canvas, translate);
  processProps(generalGroup, element, translate, processOptions);
  versionTag(generalGroup, element, translate);
  executableProps(generalGroup, element, translate);
  elementTemplateChooserProps(
    generalGroup,
    element,
    elementTemplates,
    translate
  );

  let customFieldsGroups = elementTemplateCustomProps(
    element,
    elementTemplates,
    bpmnFactory,
    translate
  );

  let detailsGroup = {
    id: "details",
    label: translate("Details"),
    entries: [],
  };
  serviceTaskDelegateProps(detailsGroup, element, bpmnFactory, translate);
  scriptProps(detailsGroup, element, bpmnFactory, translate);
  linkProps(detailsGroup, element, translate);
  callActivityProps(detailsGroup, element, bpmnFactory, translate);
  eventProps(detailsGroup, element, bpmnFactory, elementRegistry, translate);
  errorProps(detailsGroup, element, bpmnFactory, translate);
  conditionalProps(detailsGroup, element, bpmnFactory, translate);
  startEventInitiator(detailsGroup, element, translate); // this must be the last element of the details group!

  let multiInstanceGroup = {
    id: "multiInstance",
    label: translate("Multi Instance"),
    entries: [],
  };
  multiInstanceProps(multiInstanceGroup, element, bpmnFactory, translate);

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
  if (element.type === "bpmn:UserTask") {
    customFieldsGroups.forEach(function (group) {
      groups.push(group);
    });
  }
  groups.push(detailsGroup);
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
  };
  variableMapping(variablesGroup, element, bpmnFactory, translate);

  return [variablesGroup];
}

function createFormsTabGroups(
  element,
  bpmnFactory,
  elementRegistry,
  translate
) {
  if (is(element, "bpmn:UserTask")) {
    return;
  }
  let formGroup = {
    id: "forms",
    label: translate("Forms"),
    entries: [],
  };
  formProps(formGroup, element, bpmnFactory, translate);

  return [formGroup];
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
  };

  let options = listenerProps(listenersGroup, element, bpmnFactory, translate);

  let listenerDetailsGroup = {
    id: "listener-details",
    entries: [],
    enabled: function (element, node) {
      if (!node) return false; //TODO - Send selected Node
      return options.getSelectedListener(element, node);
    },
    label: function (element, node) {
      if (!node) return; //TODO - Send selected Node
      let param = options.getSelectedListener(element, node);
      return getListenerLabel(param, translate);
    },
  };

  listenerDetails(
    listenerDetailsGroup,
    element,
    bpmnFactory,
    options,
    translate
  );

  let listenerFieldsGroup = {
    id: "listener-fields",
    label: translate("Field Injection"),
    entries: [],
    enabled: function (element, node) {
      if (!node) return false; //TODO - Send selected Node
      return options.getSelectedListener(element, node);
    },
  };

  listenerFields(listenerFieldsGroup, element, bpmnFactory, options, translate);

  return [listenersGroup, listenerDetailsGroup, listenerFieldsGroup];
}

function createConnectorTabGroups(
  element,
  bpmnFactory,
  elementRegistry,
  translate
) {
  let connectorDetailsGroup = {
    id: "connector-details",
    label: translate("Details"),
    entries: [],
  };

  connectorDetails(connectorDetailsGroup, element, bpmnFactory, translate);

  let connectorInputOutputGroup = {
    id: "connector-input-output",
    label: translate("Input/Output"),
    entries: [],
  };

  let options = connectorInputOutput(
    connectorInputOutputGroup,
    element,
    bpmnFactory,
    translate
  );

  let connectorInputOutputParameterGroup = {
    id: "connector-input-output-parameter",
    entries: [],
    enabled: function (element, node) {
      if (!node) return false; //TODO - Send selected Node
      return options.getSelectedParameter(element, node);
    },
    label: function (element, node) {
      if (!node) return false; //TODO - Send selected Node
      let param = options.getSelectedParameter(element, node);
      return getInputOutputParameterLabel(param, translate);
    },
  };

  connectorInputOutputParameter(
    connectorInputOutputParameterGroup,
    element,
    bpmnFactory,
    options,
    translate
  );

  return [
    connectorDetailsGroup,
    connectorInputOutputGroup,
    connectorInputOutputParameterGroup,
  ];
}

function createFieldInjectionsTabGroups(
  element,
  bpmnFactory,
  elementRegistry,
  translate
) {
  let fieldGroup = {
    id: "field-injections-properties",
    label: translate("Field Injections"),
    entries: [],
  };

  fieldInjections(fieldGroup, element, bpmnFactory, translate);

  return [fieldGroup];
}

export default function getTabs(
  element,
  canvas,
  bpmnFactory,
  elementRegistry,
  elementTemplates,
  translate
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
      translate
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

  let formsTab = {
    id: "forms",
    label: translate("Forms"),
    groups: createFormsTabGroups(
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
    enabled: function (element) {
      return (
        !eventDefinitionHelper.getLinkEventDefinition(element) ||
        (!is(element, "bpmn:IntermediateThrowEvent") &&
          eventDefinitionHelper.getLinkEventDefinition(element))
      );
    },
  };

  let connectorTab = {
    id: "connector",
    label: translate("Connector"),
    groups: createConnectorTabGroups(
      element,
      bpmnFactory,
      elementRegistry,
      translate
    ),
    enabled: function (element) {
      let bo = implementationTypeHelper.getServiceTaskLikeBusinessObject(
        element
      );
      return (
        bo && implementationTypeHelper.getImplementationType(bo) === "connector"
      );
    },
  };

  let fieldInjectionsTab = {
    id: "field-injections",
    label: translate("Field Injections"),
    groups: createFieldInjectionsTabGroups(
      element,
      bpmnFactory,
      elementRegistry,
      translate
    ),
  };

  let viewAttributesTab = {
    id: "view-attributes",
    label: translate("View Attributes"),
    groups:[
      {
        id: "view-attributes",
        label: translate("View Attributes"),
      }
    ]
  };

  let tabs = [
    generalTab,
    viewAttributesTab,
    variablesTab,
    connectorTab,
    formsTab,
    listenersTab,
    fieldInjectionsTab,
  ];
  return tabs;
}
