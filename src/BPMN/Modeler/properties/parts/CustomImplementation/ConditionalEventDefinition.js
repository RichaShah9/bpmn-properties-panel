import React, { useState, useEffect } from "react";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import { isEventSubProcess } from "bpmn-js/lib/util/DiUtil";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import { TextField, Textbox, SelectBox } from "../../components";
import { translate } from "../../../../../utils";

export default function ConditionalEventProps({
  element,
  conditionalEventDefinition,
  bpmnFactory,
}) {
  const [conditionType, setConditionType] = useState("script");
  useEffect(() => {
    let bo = getBusinessObject(element);
    let conditionExpression = conditionalEventDefinition
      ? conditionalEventDefinition.condition
      : bo.conditionExpression;
    let conditionType = "script";
    if (conditionExpression) {
      let conditionLanguage = conditionExpression.language;
      if (conditionLanguage || conditionLanguage === "") {
        conditionType = "script";
      } else if (conditionExpression.body || conditionExpression.body === "") {
        conditionType = "expression";
      }
    }
    setConditionType(conditionType);
  }, [element, conditionalEventDefinition]);

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
      <SelectBox
        element={element}
        entry={{
          id: "conditionType",
          label: "Condition Type",
          modelProperty: "conditionType",
          selectOptions: [
            { name: "Expression", value: "expression" },
            { name: "Script", value: "script" },
          ],
          emptyParameter: true,
          get: function () {
            return { conditionType: conditionType };
          },
          set: function (e, values) {
            setConditionType(values.conditionType);
            let bo = getBusinessObject(element);
            let conditionType = values.conditionType;
            let conditionProps = {
              body: undefined,
              language: undefined,
            };
            if (conditionType === "script") {
              conditionProps = {
                body: "",
                language: "axelor",
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
            } else {
              element.businessObject.conditionExpression = conditionOrConditionExpression;
            }
          },
        }}
      />
      {conditionType === "expression" && (
        <TextField
          element={element}
          entry={{
            id: "expression",
            label: translate("Expression"),
            modelProperty: "expression",
            get: function () {
              if (
                conditionalEventDefinition &&
                conditionalEventDefinition.condition
              ) {
                return {
                  expression: conditionalEventDefinition.condition.body,
                };
              }
            },
            set: function (e, values) {
              if (
                conditionalEventDefinition &&
                conditionalEventDefinition.condition
              ) {
                conditionalEventDefinition.condition.body = values.expression;
              }
            },
            validate: function (e, values) {
              if (!values.expression && conditionType === "expression") {
                return { expression: "Must provide a value" };
              }
            },
          }}
          canRemove={true}
        />
      )}
      {conditionType === "script" && (
        <div>
          <TextField
            element={element}
            entry={{
              id: "scriptFormat",
              label: translate("Script Format"),
              modelProperty: "scriptFormat",
              get: function () {
                if (
                  conditionalEventDefinition &&
                  conditionalEventDefinition.condition
                ) {
                  let boScriptFormat =
                    conditionalEventDefinition.condition.language;
                  if (!boScriptFormat) {
                    conditionalEventDefinition.condition.language = "axelor";
                    boScriptFormat = "axelor";
                  }
                  return { scriptFormat: boScriptFormat };
                }
              },
              set: function (element, values) {
                let scriptFormat = values.scriptFormat;
                if (
                  conditionalEventDefinition &&
                  conditionalEventDefinition.condition
                ) {
                  conditionalEventDefinition.condition.language = scriptFormat;
                }
              },
              validate: function (e, values) {
                if (!values.scriptFormat && conditionType === "script") {
                  return { scriptFormat: "Must provide a value" };
                }
              },
            }}
            canRemove={true}
          />
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
                if (conditionalEventDefinition) {
                  conditionalEventDefinition.condition.body = values.script;
                  conditionalEventDefinition.condition.resource = undefined;
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
      )}
    </div>
  );
}
