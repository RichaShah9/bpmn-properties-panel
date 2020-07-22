import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import eventDefinitionHelper from "bpmn-js-properties-panel/lib/helper/EventDefinitionHelper";

import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";
import { query as domQuery } from "min-dom";

import scriptImplementation from "./implementation/Script";

export default function ConditionalProps(
  group,
  element,
  bpmnFactory,
  translate
) {
  let bo = getBusinessObject(element);

  if (!bo) {
    return;
  }

  let conditionalEventDefinition = eventDefinitionHelper.getConditionalEventDefinition(
    element
  );

  if (
    !(
      is(element, "bpmn:SequenceFlow") && isConditionalSource(element.source)
    ) &&
    !conditionalEventDefinition
  ) {
    return;
  }

  let script = scriptImplementation("language", "body", true, translate);
  group.entries.push({
    id: "condition",
    label: translate("Condition"),

    get: function (element, propertyName) {
      let conditionalEventDefinition = eventDefinitionHelper.getConditionalEventDefinition(
        element
      );

      let conditionExpression = conditionalEventDefinition
        ? conditionalEventDefinition.condition
        : bo.conditionExpression;

      let values = {},
        conditionType = "";

      if (conditionExpression) {
        let conditionLanguage = conditionExpression.language;
        if (typeof conditionLanguage !== "undefined") {
          conditionType = "script";
          values = script.get(element, conditionExpression);
        } else {
          conditionType = "expression";
          values.condition = conditionExpression.get("body");
        }
      }

      values.conditionType = conditionType;

      return values;
    },

    set: function (element, values, containerElement) {
      let conditionType = values.conditionType;
      let commands = [];

      let conditionProps = {
        body: undefined,
      };

      if (conditionType === "script") {
        conditionProps = script.set(element, values, containerElement);
      } else {
        let condition = values.condition;

        conditionProps.body = condition;
      }

      let conditionOrConditionExpression;

      if (conditionType) {
        conditionOrConditionExpression = elementHelper.createElement(
          "bpmn:FormalExpression",
          conditionProps,
          conditionalEventDefinition || bo,
          bpmnFactory
        );

        let source = element.source;

        // if default-flow, remove default-property from source
        if (source && source.businessObject.default === bo) {
          commands.push(
            cmdHelper.updateProperties(source, { default: undefined })
          );
        }
      }

      let update = conditionalEventDefinition
        ? { condition: conditionOrConditionExpression }
        : { conditionExpression: conditionOrConditionExpression };

      commands.push(
        cmdHelper.updateBusinessObject(
          element,
          conditionalEventDefinition || bo,
          update
        )
      );

      return commands;
    },

    validate: function (element, values) {
      let validationResult = {};

      if (!values.condition && values.conditionType === "expression") {
        validationResult.condition = translate("Must provide a value");
      } else if (values.conditionType === "script") {
        validationResult = script.validate(element, values);
      }

      return validationResult;
    },

    isExpression: function (element, inputNode) {
      let conditionType = domQuery("select[name=conditionType]", inputNode);
      if (conditionType.selectedIndex >= 0) {
        return (
          conditionType.options[conditionType.selectedIndex].value ===
          "expression"
        );
      }
    },

    isScript: function (element, inputNode) {
      let conditionType = domQuery("select[name=conditionType]", inputNode);
      if (conditionType.selectedIndex >= 0) {
        return (
          conditionType.options[conditionType.selectedIndex].value === "script"
        );
      }
    },

    clear: function (element, inputNode) {
      // clear text input
      domQuery("input[name=condition]", inputNode).value = "";

      return true;
    },

    canClear: function (element, inputNode) {
      let input = domQuery("input[name=condition]", inputNode);

      return input.value !== "";
    },

    script: script,

    cssClasses: ["bpp-textfield"],
  });
}

// utilities //////////////////////////

let CONDITIONAL_SOURCES = [
  "bpmn:Activity",
  "bpmn:ExclusiveGateway",
  "bpmn:InclusiveGateway",
  "bpmn:ComplexGateway",
];

function isConditionalSource(element) {
  return isAny(element, CONDITIONAL_SOURCES);
}
