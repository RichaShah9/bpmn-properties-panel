import { is } from "bpmn-js/lib/util/ModelUtil";
import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import ImplementationTypeHelper from "bpmn-js-properties-panel/lib/helper/ImplementationTypeHelper";
import { find } from "min-dash";
import scriptImplementation from "./implementation/Script";
import timerImplementation from "./implementation/TimerEventDefinition";

export default function ListenerDetailProps(
  group,
  element,
  bpmnFactory,
  options,
  translate
) {
  let LISTENER_TYPE_LABEL = {
    class: translate("Java Class"),
    expression: translate("Expression"),
    delegateExpression: translate("Delegate Expression"),
    script: translate("Script"),
  };

  options = options || {};

  let getSelectedListener = options.getSelectedListener;

  let classProp = "class",
    expressionProp = "expression",
    delegateExpressionProp = "delegateExpression",
    scriptProp = "script";

  let executionListenerEventTypeOptions = ImplementationTypeHelper.isSequenceFlow(
    element
  )
    ? [{ name: translate("take"), value: "take" }]
    : [
        { name: translate("start"), value: "start" },
        { name: translate("end"), value: "end" },
      ];

  let taskListenerEventTypeOptions = [
    { name: translate("create"), value: "create" },
    { name: translate("assignment"), value: "assignment" },
    { name: translate("complete"), value: "complete" },
    { name: translate("delete"), value: "delete" },
    { name: translate("update"), value: "update" },
    { name: translate("timeout"), value: "timeout" },
  ];

  let isSelected = function (element, node) {
    return getSelectedListener(element, node);
  };

  // eventType ////////////////
  group.entries.push({
    id: "listener-event-type",
    label: translate("Event Type"),
    modelProperty: "eventType",
    emptyParameter: false,
    widget: "selectBox",
    get: function (element, node) {
      let listener = getSelectedListener(element, node);

      let eventType = listener && listener.get("event");

      return {
        eventType: eventType,
      };
    },

    set: function (element, values, node) {
      let eventType = values.eventType,
        listener = getSelectedListener(element, node),
        eventDefinitions = listener && listener.eventDefinitions;

      // ensure only timeout events can have timer event definitions
      if (eventDefinitions && eventType !== "timeout") {
        eventDefinitions = [];
      }

      return cmdHelper.updateBusinessObject(element, listener, {
        event: eventType,
        eventDefinitions: eventDefinitions,
      });
    },

    selectOptions: function (element, node) {
      let eventTypeOptions;
      if(!node) return
      let selectedListener = getSelectedListener(element, node);
      if (ImplementationTypeHelper.isTaskListener(selectedListener)) {
        eventTypeOptions = taskListenerEventTypeOptions;
      } else if (
        ImplementationTypeHelper.isExecutionListener(selectedListener)
      ) {
        eventTypeOptions = executionListenerEventTypeOptions;
      }

      return eventTypeOptions;
    },

    hidden: function (element, node) {
      return !isSelected(element, node);
    },
  });

  // listenerId ///////////////
  group.entries.push({
    id: "listener-id",
    label: translate("Listener Id"),
    modelProperty: "listenerId",
    widget: "textField",

    get: function (element, node) {
      let value = {},
        listener = getSelectedListener(element, node);

      value.listenerId = (listener && listener.get("id")) || undefined;

      return value;
    },

    set: function (element, values, node) {
      let update = {},
        listener = getSelectedListener(element, node);

      update["id"] = values.listenerId || "";

      return cmdHelper.updateBusinessObject(element, listener, update);
    },

    hidden: function (element, node) {
      let listener = getSelectedListener(element, node);

      return !ImplementationTypeHelper.isTaskListener(listener);
    },

    validate: function (element, values, node) {
      let value = values.listenerId,
        listener = getSelectedListener(element, node),
        validate = {};

      if (!value && isTimeoutTaskListener(listener)) {
        validate.listenerId = translate(
          "Must provide a value for timeout task listener"
        );
      }

      return validate;
    },
  });

  // listenerType ///////////////
  group.entries.push({
    id: "listener-type",
    label: translate("Listener Type"),
    selectOptions: [
      { value: classProp, name: translate("Java Class") },
      { value: expressionProp, name: translate("Expression") },
      {
        value: delegateExpressionProp,
        name: translate("Delegate Expression"),
      },
      { value: scriptProp, name: translate("Script") },
    ],
    modelProperty: "listenerType",
    emptyParameter: false,
    widget: "selectBox",

    get: function (element, node) {
      let listener = getSelectedListener(element, node);
      return {
        listenerType: ImplementationTypeHelper.getImplementationType(listener),
      };
    },

    set: function (element, values, node) {
      let listener = getSelectedListener(element, node),
        listenerType = values.listenerType || undefined,
        update = {};

      update[classProp] = listenerType === classProp ? "" : undefined;
      update[expressionProp] = listenerType === expressionProp ? "" : undefined;
      update[delegateExpressionProp] =
        listenerType === delegateExpressionProp ? "" : undefined;
      update[scriptProp] =
        listenerType === scriptProp
          ? bpmnFactory.create("camunda:Script")
          : undefined;

      return cmdHelper.updateBusinessObject(element, listener, update);
    },

    hidden: function (element, node) {
      return !isSelected(element, node);
    },
  });

  // listenerValue //////////////
  group.entries.push({
    id: "listener-value",
    dataValueLabel: "listenerValueLabel",
    modelProperty: "listenerValue",
    widget: "textField",
    get: function (element, node) {
      let value = {},
        listener = getSelectedListener(element, node),
        listenerType = ImplementationTypeHelper.getImplementationType(listener);

      value.listenerValueLabel = LISTENER_TYPE_LABEL[listenerType] || "";
      value.listenerValue =
        (listener && listener.get(listenerType)) || undefined;

      return value;
    },

    set: function (element, values, node) {
      let update = {},
        listener = getSelectedListener(element, node),
        listenerType = ImplementationTypeHelper.getImplementationType(listener);

      update[listenerType] = values.listenerValue || "";

      return cmdHelper.updateBusinessObject(element, listener, update);
    },

    hidden: function (element, node) {
      let listener = getSelectedListener(element, node);
      return !listener || listener.script;
    },

    validate: function (element, values) {
      let value = values.listenerValue,
        validate = {};

      if (!value) {
        validate.listenerValue = translate("Must provide a value");
      }

      return validate;
    },
  });

  // script ////////////////////
  let script = scriptImplementation("scriptFormat", "value", true, translate);

  group.entries.push({
    id: "listener-script-value",
    html: '<div data-show="isScript">' + script.template + "</div>",

    get: function (element, node) {
      let listener = getSelectedListener(element, node);
      return listener && listener.script
        ? script.get(element, listener.script)
        : {};
    },

    set: function (element, values, node) {
      let listener = getSelectedListener(element, node);
      let update = script.set(element, values, listener);
      return cmdHelper.updateBusinessObject(element, listener.script, update);
    },

    validate: function (element, values, node) {
      let listener = getSelectedListener(element, node);
      return listener && listener.script
        ? script.validate(element, values)
        : {};
    },

    isScript: function (element, node) {
      let listener = getSelectedListener(element, node);
      return listener && listener.script;
    },

    script: script,
  });

  // timerEventDefinition //////
  let timerEventDefinitionHandler = function (element, node) {
    let listener = getSelectedListener(element, node);

    if (!listener || !isTimeoutTaskListener(listener)) {
      return;
    }

    let timerEventDefinition = getTimerEventDefinition(listener);

    if (!timerEventDefinition) {
      return false;
    }

    return timerEventDefinition;
  };

  function createTimerEventDefinition(element, node) {
    let listener = getSelectedListener(element, node);

    if (!listener || !isTimeoutTaskListener(listener)) {
      return;
    }

    let eventDefinitions = listener.get("eventDefinitions") || [],
      timerEventDefinition = bpmnFactory.create("bpmn:TimerEventDefinition");

    eventDefinitions.push(timerEventDefinition);

    listener.eventDefinitions = eventDefinitions;

    return timerEventDefinition;
  }

  let timerOptions = {
    idPrefix: "listener-",
    createTimerEventDefinition: createTimerEventDefinition,
  };

  timerImplementation(
    group,
    element,
    bpmnFactory,
    timerEventDefinitionHandler,
    translate,
    timerOptions
  );
}

// helpers //////////////

function isTimeoutTaskListener(listener) {
  let eventType = listener && listener.event;
  return eventType === "timeout";
}

function getTimerEventDefinition(bo) {
  let eventDefinitions = bo.eventDefinitions || [];

  return find(eventDefinitions, function (event) {
    return is(event, "bpmn:TimerEventDefinition");
  });
}
