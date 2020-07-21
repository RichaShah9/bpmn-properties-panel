import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import flattenDeep from "lodash/flattenDeep";
import assign from "lodash/assign";
import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";

import callable from "./implementation/Callable";

function getCallableType(element) {
  let bo = getBusinessObject(element);

  let boCalledElement = bo.get("calledElement"),
    boCaseRef = bo.get("camunda:caseRef");

  let callActivityType = "";
  if (typeof boCalledElement !== "undefined") {
    callActivityType = "bpmn";
  } else if (typeof boCaseRef !== "undefined") {
    callActivityType = "cmmn";
  }

  return callActivityType;
}

let DEFAULT_PROPS = {
  calledElement: undefined,
  "camunda:calledElementBinding": "latest",
  "camunda:calledElementVersion": undefined,
  "camunda:calledElementTenantId": undefined,
  "camunda:variableMappingClass": undefined,
  "camunda:variableMappingDelegateExpression": undefined,
  "camunda:caseRef": undefined,
  "camunda:caseBinding": "latest",
  "camunda:caseVersion": undefined,
  "camunda:caseTenantId": undefined,
};

export default function CallActivityProps(
  group,
  element,
  bpmnFactory,
  translate
) {
  if (!is(element, "camunda:CallActivity")) {
    return;
  }

  group.entries.push({
    id: "callActivity",
    label: translate("CallActivity Type"),
    selectOptions: [
      { name: "BPMN", value: "bpmn" },
      { name: "CMMN", value: "cmmn" },
    ],
    emptyParameter: true,
    modelProperty: "callActivityType",
    widget: "selectBox",
    get: function (element, node) {
      return {
        callActivityType: getCallableType(element),
      };
    },

    set: function (element, values, node) {
      let type = values.callActivityType;

      let props = assign({}, DEFAULT_PROPS);

      if (type === "bpmn") {
        props.calledElement = "";
      } else if (type === "cmmn") {
        props["camunda:caseRef"] = "";
      }

      return cmdHelper.updateProperties(element, props);
    },
  });

  group.entries.push(
    callable(
      element,
      bpmnFactory,
      {
        getCallableType: getCallableType,
      },
      translate
    )
  );

  group.entries = flattenDeep(group.entries);
}
