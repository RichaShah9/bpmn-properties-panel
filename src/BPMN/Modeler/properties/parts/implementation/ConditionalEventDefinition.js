import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import { is } from "bpmn-js/lib/util/ModelUtil";
import { isEventSubProcess } from "bpmn-js/lib/util/DiUtil";

export default function ConditionalEventDefinition(
  group,
  element,
  bpmnFactory,
  conditionalEventDefinition,
  elementRegistry,
  translate
) {
  let getValue = function (modelProperty) {
    return function (element) {
      let modelPropertyValue = conditionalEventDefinition.get(
        "camunda:" + modelProperty
      );
      let value = {};

      value[modelProperty] = modelPropertyValue;
      return value;
    };
  };

  let setValue = function (modelProperty) {
    return function (element, values) {
      let props = {};

      props["camunda:" + modelProperty] = values[modelProperty] || undefined;

      return cmdHelper.updateBusinessObject(
        element,
        conditionalEventDefinition,
        props
      );
    };
  };

  group.entries.push({
    id: "variableName",
    label: translate("Variable Name"),
    modelProperty: "variableName",
    widget: "textField",
    get: getValue("variableName"),
    set: setValue("variableName"),
  });

  let isConditionalStartEvent =
    is(element, "bpmn:StartEvent") && !isEventSubProcess(element.parent);

  if (!isConditionalStartEvent) {
    group.entries.push({
      id: "variableEvent",
      label: translate("Variable Event"),
      description: translate(
        "Specify more than one variable change event as a comma separated list."
      ),
      modelProperty: "variableEvent",
      widget: "textField",
      get: getValue("variableEvent"),
      set: setValue("variableEvent"),
    });
  }
}
