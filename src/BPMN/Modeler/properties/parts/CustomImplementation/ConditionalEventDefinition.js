import React from "react";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import { isEventSubProcess } from "bpmn-js/lib/util/DiUtil";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import { TextField, Textbox } from "../../components";
import { translate } from "../../../../../utils";

const conditionType = "script";

export default function ConditionalEventProps({
  element,
  conditionalEventDefinition,
  bpmnFactory,
}) {
  const getValue = (modelProperty) => {
    return function (element) {
      let modelPropertyValue = conditionalEventDefinition.get(
        "camunda:" + modelProperty
      );
      let value = {};
      value[modelProperty] = modelPropertyValue;
      return value;
    };
  };

  const setValue = (modelProperty) => {
    return function (element, values) {
      let props = {};
      props["camunda:" + modelProperty] = values[modelProperty] || undefined;
      conditionalEventDefinition[modelProperty] = values[modelProperty];
    };
  };

  return (
    <div>
      <TextField
        element={element}
        entry={{
          id: "variableName",
          label: translate("Variable Name"),
          modelProperty: "variableName",
          widget: "textField",
          get: getValue("variableName"),
          set: setValue("variableName"),
        }}
      />
      {!(
        is(element, "bpmn:StartEvent") && !isEventSubProcess(element.parent)
      ) && (
        <TextField
          element={element}
          entry={{
            id: "variableEvent",
            label: translate("Variable Event"),
            description: translate(
              "Specify more than one variable change event as a comma separated list."
            ),
            modelProperty: "variableEvent",
            widget: "textField",
            get: getValue("variableEvent"),
            set: setValue("variableEvent"),
          }}
        />
      )}

      <Textbox
        element={element}
        rows={3}
        entry={{
          id: "script",
          label: translate("Script"),
          modelProperty: "script",
          get: function () {
            if (
              conditionalEventDefinition &&
              conditionalEventDefinition.condition
            ) {
              return {
                script: conditionalEventDefinition.condition.body,
              };
            }
          },
          set: function (e, values) {
            const bo = getBusinessObject(element);
            if (conditionalEventDefinition) {
              conditionalEventDefinition.condition.body = values.script;
              conditionalEventDefinition.condition.resource = undefined;
              conditionalEventDefinition.condition.language = "axelor";
            } else {
              let conditionProps = {
                body: undefined,
                language: undefined,
              };
              if (conditionType === "script") {
                conditionProps = {
                  body: "",
                  language: "",
                  "camunda:resource": undefined,
                };
              }
              if (conditionType === "expression") {
                conditionProps.body = "";
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
                  source.default = undefined;
                }
              }
              Object.entries(conditionProps).forEach(([key, value]) => {
                if (!conditionOrConditionExpression) return;
                conditionOrConditionExpression[key] = value;
              });
              if (conditionalEventDefinition) {
                conditionalEventDefinition.condition = conditionOrConditionExpression;
                if (conditionalEventDefinition.condition) {
                  conditionalEventDefinition.condition.body = values.script;
                  conditionalEventDefinition.condition.resource = undefined;
                  conditionalEventDefinition.condition.language = "axelor";
                }
              } else {
                element.businessObject.conditionExpression = conditionOrConditionExpression;
              }
            }
          },
          validate: function (e, values) {
            if (!values.script && conditionType === "script") {
              return { script: "Must provide a value" };
            }
          },
        }}
      />
    </div>
  );
}
