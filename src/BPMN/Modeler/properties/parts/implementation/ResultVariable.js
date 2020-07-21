import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import { is } from "bpmn-js/lib/util/ModelUtil";
import assign from "lodash/assign";

export default function ResultVariable(
  element,
  bpmnFactory,
  options,
  translate
) {
  let getBusinessObject = options.getBusinessObject,
    hideResultVariable = options.hideResultVariable,
    id = options.id || "resultVariable";

  let resultVariableEntry = {
    id: id,
    label: translate("Result Variable"),
    modelProperty: "resultVariable",
    widget: "textField",
    get: function (element, node) {
      let bo = getBusinessObject(element);
      return { resultVariable: bo.get("camunda:resultVariable") };
    },

    set: function (element, values, node) {
      let bo = getBusinessObject(element);

      let resultVariable = values.resultVariable || undefined;

      let props = {
        "camunda:resultVariable": resultVariable,
      };

      if (is(bo, "camunda:DmnCapable") && !resultVariable) {
        props = assign({ "camunda:mapDecisionResult": "resultList" }, props);
      }

      return cmdHelper.updateBusinessObject(element, bo, props);
    },

    hidden: function (element, node) {
      if (typeof hideResultVariable === "function") {
        return hideResultVariable.apply(resultVariableEntry, arguments);
      }
    },
  };

  return [resultVariableEntry];
}
