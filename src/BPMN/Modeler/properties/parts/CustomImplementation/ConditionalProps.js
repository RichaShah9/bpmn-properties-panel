import React, { useEffect, useState } from "react";
import eventDefinitionHelper from "bpmn-js-properties-panel/lib/helper/EventDefinitionHelper";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import { makeStyles } from "@material-ui/core/styles";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";

import { TextField, SelectBox, Textbox } from "../../components";
import { translate } from "../../../../../utils";

const useStyles = makeStyles({
  groupLabel: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    fontSize: "120%",
    margin: "10px 0px",
    transition: "margin 0.218s linear",
    fontStyle: "italic",
  },
  divider: {
    marginTop: 15,
    border: "1px dotted #ccc",
  },
});

let CONDITIONAL_SOURCES = [
  "bpmn:Activity",
  "bpmn:ExclusiveGateway",
  "bpmn:InclusiveGateway",
  "bpmn:ComplexGateway",
];

function isConditionalSource(element) {
  return isAny(element, CONDITIONAL_SOURCES);
}

export default function ConditionalProps({
  element,
  index,
  label,
  bpmnFactory,
  bpmnModeler,
}) {
  const [isVisible, setVisible] = useState(false);
  const [conditionType, setConditionType] = useState("");
  const [scriptType, setScriptType] = useState("script");
  const classes = useStyles();

  useEffect(() => {
    let bo = getBusinessObject(element);
    let conditionalEventDefinition = eventDefinitionHelper.getConditionalEventDefinition(
      element
    );
    let conditionExpression = conditionalEventDefinition
      ? conditionalEventDefinition.condition
      : bo.conditionExpression;
    let conditionType = "";
    if (conditionExpression) {
      let conditionLanguage = conditionExpression.language;
      if (conditionLanguage || conditionLanguage === "") {
        conditionType = "script";
      } else {
        conditionType = "expression";
      }
    }
    setConditionType(conditionType);
  }, [element]);

  useEffect(() => {
    let bo = getBusinessObject(element);
    let type = "script";
    if (
      bo.conditionExpression &&
      (bo.conditionExpression.resource ||
        bo.conditionExpression.resource === "")
    ) {
      type = "scriptResource";
    }
    setScriptType(type);
  }, [element]);

  useEffect(() => {
    if (
      is(element, "bpmn:SequenceFlow") &&
      isConditionalSource(element.source)
    ) {
      setVisible(true);
    }
  }, [element]);

  return (
    isVisible && (
      <div>
        <React.Fragment>
          {index > 0 && <div className={classes.divider} />}
        </React.Fragment>
        <div className={classes.groupLabel}>{label}</div>
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
                  language: "",
                  "camunda:resource": undefined,
                };
              }

              let conditionOrConditionExpression;
              let conditionalEventDefinition = eventDefinitionHelper.getConditionalEventDefinition(
                element
              );
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

              if (conditionalEventDefinition) {
                element.businessObject.condition = conditionOrConditionExpression;
              } else {
                element.businessObject.conditionExpression = conditionOrConditionExpression;
              }
              if(!bpmnModeler) return
              let elementRegistry = bpmnModeler.get("elementRegistry");
              let modeling = bpmnModeler.get("modeling");
              let shape = elementRegistry.get(element.id);
              modeling &&
                modeling.updateProperties(shape, {
                  [conditionalEventDefinition
                    ? "condition"
                    : "conditionExpression"]: conditionOrConditionExpression,
                });
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
                  element.businessObject &&
                  element.businessObject.conditionExpression
                ) {
                  return {
                    expression: element.businessObject.conditionExpression.body,
                  };
                }
              },
              set: function (e, values) {
                if (
                  element.businessObject &&
                  element.businessObject.conditionExpression
                ) {
                  element.businessObject.conditionExpression.body =
                    values.expression;
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
                  const bo = getBusinessObject(element);
                  if (bo.conditionExpression) {
                    let boScriptFormat = bo.conditionExpression.language;
                    return { scriptFormat: boScriptFormat };
                  }
                },

                set: function (element, values) {
                  let scriptFormat = values.scriptFormat;
                  if (
                    element.businessObject &&
                    element.businessObject.conditionExpression
                  ) {
                    element.businessObject.conditionExpression.language = scriptFormat;
                  }
                },
              }}
              canRemove={true}
            />
            <SelectBox
              element={element}
              entry={{
                id: "scriptType",
                label: "Script Type",
                modelProperty: "scriptType",
                selectOptions: [
                  { name: "Inline Script", value: "script" },
                  { name: "External Resource", value: "scriptResource" },
                ],
                emptyParameter: false,
                get: function () {
                  return { scriptType: scriptType };
                },
                set: function (e, values) {
                  if (values && !values.scriptType) return;
                  setScriptType(values.scriptType);
                  if (values.scriptType === "script") {
                    if (
                      element.businessObject &&
                      element.businessObject.conditionExpression
                    ) {
                      element.businessObject.conditionExpression.resource = undefined;
                      element.businessObject.conditionExpression.body = "";
                    }
                  } else {
                    if (
                      element.businessObject &&
                      element.businessObject.conditionExpression
                    ) {
                      element.businessObject.conditionExpression.resource = "";
                      element.businessObject.conditionExpression.body = undefined;
                    }
                  }
                },
              }}
            />
            {scriptType === "scriptResource" && (
              <TextField
                element={element}
                entry={{
                  id: "resource",
                  label: translate("Resource"),
                  modelProperty: "resource",
                  get: function () {
                    let bo = getBusinessObject(element);
                    if (
                      bo.conditionExpression &&
                      bo.conditionExpression.resource
                    ) {
                      return { resource: bo.conditionExpression.resource };
                    }
                  },
                  set: function (e, values) {
                    if (
                      element.businessObject &&
                      element.businessObject.conditionExpression
                    ) {
                      element.businessObject.conditionExpression.resource =
                        values.resource;
                      element.businessObject.conditionExpression.body = undefined;
                    }
                  },
                }}
                canRemove={true}
              />
            )}
            {scriptType === "script" && (
              <Textbox
                element={element}
                rows={3}
                entry={{
                  id: "script",
                  label: translate("Script"),
                  modelProperty: "script",
                  get: function () {
                    let bo = getBusinessObject(element);
                    if (bo.conditionExpression && bo.conditionExpression.body) {
                      return { script: bo.conditionExpression.body };
                    }
                  },
                  set: function (e, values) {
                    if (
                      element.businessObject &&
                      element.businessObject.conditionExpression
                    ) {
                      element.businessObject.conditionExpression.body =
                        values.script;
                      element.businessObject.conditionExpression.resource = undefined;
                    }
                  },
                }}
              />
            )}
          </div>
        )}
      </div>
    )
  );
}
