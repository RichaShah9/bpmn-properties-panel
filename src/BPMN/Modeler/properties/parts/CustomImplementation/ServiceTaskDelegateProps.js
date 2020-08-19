import React, { useEffect, useState } from "react";
import ImplementationTypeHelper from "bpmn-js-properties-panel/lib/helper/ImplementationTypeHelper";
import { makeStyles } from "@material-ui/core/styles";
import { is } from "bpmn-js/lib/util/ModelUtil";

import { SelectBox, TextField } from "../../components";
import { translate } from "../../../../../utils";

function isServiceTaskLike(element) {
  return ImplementationTypeHelper.isServiceTaskLike(element);
}

function getBusinessObject(element) {
  return ImplementationTypeHelper.getServiceTaskLikeBusinessObject(element);
}

const bindingOptions = [
  {
    name: translate("latest"),
    value: "latest",
  },
  {
    name: translate("deployment"),
    value: "deployment",
  },
  {
    name: translate("version"),
    value: "version",
  },
  {
    name: translate("versionTag"),
    value: "versionTag",
  },
];

const mapDecisionResultOptions = [
  {
    name: "singleEntry (TypedValue)",
    value: "singleEntry",
  },
  {
    name: "singleResult (Map<String, Object>)",
    value: "singleResult",
  },
  {
    name: "collectEntries (List<Object>)",
    value: "collectEntries",
  },
  {
    name: "resultList (List<Map<String, Object>>)",
    value: "resultList",
  },
];

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
  groupContainer: {
    marginTop: 10,
  },
  divider: {
    marginTop: 15,
    borderTop: "1px dotted #ccc",
  },
});

const implementationOptions = [
  { name: translate("Java Class"), value: "class" },
  { name: translate("Expression"), value: "expression" },
  {
    name: translate("Delegate Expression"),
    value: "delegateExpression",
  },
  { name: translate("DMN"), value: "dmn" },
  { name: translate("External"), value: "external" },
];

export default function ServiceTaskDelegateProps({ element, index, label }) {
  const [isVisible, setVisible] = useState(false);
  const [implementationType, setImplementationType] = useState("");
  const [bindingType, setBindingType] = useState("latest");
  const [resultVariable, setResultVariable] = useState(null);
  const classes = useStyles();

  const getPropertyValue = (propertyName) => {
    const bo = getBusinessObject(element);
    return bo[propertyName];
  };

  const setPropertyValue = (propertyName, value) => {
    const bo = getBusinessObject(element);
    bo[propertyName] = value;
  };

  useEffect(() => {
    let bo = getBusinessObject(element);
    let type = "script";
    if (bo.expression || bo.expression === "") {
      type = "expression";
    } else if (bo.class || bo.class === "") {
      type = "class";
    } else if (bo.delegateExpression || bo.delegateExpression === "") {
      type = "delegateExpression";
    } else if (bo.topic || bo.topic === "") {
      type = "external";
    } else if (bo.decisionRef) {
      type = "dmn";
      setResultVariable(bo.resultVariable);
      setBindingType(bo.decisionRefBinding);
    } else {
      type = "";
    }
    setImplementationType(type);
  }, [element]);

  useEffect(() => {
    if (isServiceTaskLike(getBusinessObject(element))) {
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
            id: "implementationType",
            label: "Implementation",
            modelProperty: "implementationType",
            selectOptions: function () {
              let options;
              if (!is(element, "bpmn:BusinessRuleTask")) {
                options = implementationOptions.filter(function (option) {
                  return option.value !== "dmn";
                });
              } else {
                options = implementationOptions;
              }
              return options;
            },
            emptyParameter: true,
            get: function () {
              return { implementationType: implementationType };
            },
            set: function (e, values) {
              if (!values) return;
              if (values.implementationType === "") {
                element.businessObject.delegateExpression = undefined;
                element.businessObject.class = undefined;
                element.businessObject.expression = undefined;
                element.businessObject.resultVariable = undefined;
                element.businessObject.topic = undefined;
                element.businessObject.taskPriority = undefined;
                element.businessObject.decisionRef = undefined;
              } else {
                values.implementationType !== "external"
                  ? (element.businessObject[values.implementationType] = "")
                  : (element.businessObject.topic = "");
              }
              setImplementationType(values.implementationType);
            },
          }}
        />
        {implementationType === "class" && (
          <TextField
            element={element}
            entry={{
              id: "class",
              label: translate("Java Class"),
              modelProperty: "class",
              get: function () {
                let values = {};
                const bo = getBusinessObject(element);
                let boClass = bo.get("class");
                values.class = boClass;
                return values;
              },

              set: function (element, values) {
                let className = values.class;
                if (element.businessObject) {
                  element.businessObject.class = className;
                  element.businessObject.expression = undefined;
                  element.businessObject.resultVariable = undefined;
                  element.businessObject.delegateExpression = undefined;
                  element.businessObject.topic = undefined;
                  element.businessObject.decisionRef = undefined;
                }
              },
              validate: function (e, values) {
                if (!values.class && implementationType === "class") {
                  return { class: "Must provide a value" };
                }
              },
            }}
            canRemove={true}
          />
        )}
        {implementationType === "expression" && (
          <React.Fragment>
            <TextField
              element={element}
              entry={{
                id: "expression",
                label: translate("Expression"),
                modelProperty: "expression",
                get: function () {
                  let values = {};
                  const bo = getBusinessObject(element);
                  let expression = bo.get("expression");
                  values.expression = expression;
                  return values;
                },

                set: function (element, values) {
                  let expression = values.expression;
                  if (element.businessObject) {
                    element.businessObject.expression = expression;
                    element.businessObject.class = undefined;
                    element.businessObject.delegateExpression = undefined;
                    element.businessObject.topic = undefined;
                    element.businessObject.decisionRef = undefined;
                  }
                },
                validate: function (e, values) {
                  if (
                    !values.expression &&
                    implementationType === "expression"
                  ) {
                    return { expression: "Must provide a value" };
                  }
                },
              }}
              canRemove={true}
            />
            <TextField
              element={element}
              entry={{
                id: "resultVariable",
                label: translate("Result Variable"),
                modelProperty: "resultVariable",
                get: function () {
                  let bo = getBusinessObject(element);
                  let boResultVariable = bo.get("camunda:resultVariable");
                  return { resultVariable: boResultVariable };
                },
                set: function (e, values) {
                  if (element.businessObject) {
                    element.businessObject.resultVariable =
                      values.resultVariable || undefined;
                  }
                },
              }}
              canRemove={true}
            />
          </React.Fragment>
        )}
        {implementationType === "delegateExpression" && (
          <TextField
            element={element}
            entry={{
              id: "delegateExpression",
              label: translate("Delegate Expression"),
              modelProperty: "delegateExpression",
              get: function () {
                let values = {};
                const bo = getBusinessObject(element);
                let boDelegateExpression = bo.get("delegateExpression");
                values.delegateExpression = boDelegateExpression;
                return values;
              },

              set: function (element, values) {
                let className = values.delegateExpression;
                if (element.businessObject) {
                  element.businessObject.delegateExpression = className;
                  element.businessObject.class = undefined;
                  element.businessObject.expression = undefined;
                  element.businessObject.resultVariable = undefined;
                  element.businessObject.topic = undefined;
                  element.businessObject.decisionRef = undefined;
                }
              },
              validate: function (e, values) {
                if (
                  !values.delegateExpression &&
                  implementationType === "delegateExpression"
                ) {
                  return { delegateExpression: "Must provide a value" };
                }
              },
            }}
            canRemove={true}
          />
        )}
        {implementationType === "dmn" && (
          <React.Fragment>
            <TextField
              element={element}
              entry={{
                id: "decisionRef",
                label: translate("Decision Ref"),
                modelProperty: "decisionRef",
                get: function () {
                  const bo = getBusinessObject(element);
                  return { decisionRef: bo.decisionRef };
                },
                set: function (e, values) {
                  element.businessObject.decisionRef = values.decisionRef;
                  element.businessObject.class = undefined;
                  element.businessObject.expression = undefined;
                  element.businessObject.resultVariable = undefined;
                  element.businessObject.delegateExpression = undefined;
                  element.businessObject.topic = undefined;
                },
                validate: function (e, values) {
                  if (!values.decisionRef) {
                    return { decisionRef: "Must provide a value" };
                  }
                },
              }}
              canRemove={true}
            />
            <SelectBox
              element={element}
              entry={{
                id: "decisionRefBinding",
                label: "Binding",
                modelProperty: "decisionRefBinding",
                selectOptions: bindingOptions,
                emptyParameter: true,
                get: function () {
                  return {
                    decisionRefBinding: bindingType,
                  };
                },
                set: function (e, values) {
                  setBindingType(values.decisionRefBinding);
                  setPropertyValue(
                    "decisionRefBinding",
                    values.decisionRefBinding
                  );
                },
              }}
            />
            {bindingType === "version" && (
              <TextField
                element={element}
                entry={{
                  id: "decisionRefVersion",
                  label: translate("Version"),
                  modelProperty: "decisionRefVersion",
                  get: function () {
                    return {
                      decisionRefVersion: getPropertyValue(
                        "decisionRefVersion"
                      ),
                    };
                  },
                  set: function (e, values) {
                    setPropertyValue(
                      "decisionRefVersion",
                      values.decisionRefVersion
                    );
                    setPropertyValue("decisionRefVersionTag", undefined);
                  },
                  validate: function (e, values) {
                    if (
                      !values.decisionRefVersion &&
                      bindingType === "version"
                    ) {
                      return { decisionRefVersion: "Must provide a value" };
                    }
                  },
                }}
                canRemove={true}
              />
            )}
            {bindingType === "versionTag" && (
              <TextField
                element={element}
                entry={{
                  id: "decisionRefVersionTag",
                  label: translate("Version Tag"),
                  modelProperty: "decisionRefVersionTag",
                  get: function () {
                    let bo = getBusinessObject(element);
                    return {
                      decisionRefVersionTag:
                        bo.$attrs["camunda:decisionRefVersionTag"],
                    };
                  },
                  set: function (e, values) {
                    let bo = getBusinessObject(element);
                    bo.$attrs["camunda:decisionRefVersionTag"] =
                      values.decisionRefVersionTag;
                    setPropertyValue("decisionRefVersion", undefined);
                  },
                  validate: function (e, values) {
                    if (
                      !values.decisionRefVersionTag &&
                      bindingType === "versionTag"
                    ) {
                      return {
                        decisionRefVersionTag: "Must provide a value",
                      };
                    }
                  },
                }}
                canRemove={true}
              />
            )}
            <TextField
              element={element}
              entry={{
                id: "decisionRefTenantId",
                label: translate("Tenant id"),
                modelProperty: "decisionRefTenantId",
                get: function () {
                  return {
                    decisionRefTenantId: getPropertyValue(
                      "decisionRefTenantId"
                    ),
                  };
                },
                set: function (e, values) {
                  setPropertyValue(
                    "decisionRefTenantId",
                    values.decisionRefTenantId
                  );
                },
              }}
              canRemove={true}
            />
            <TextField
              element={element}
              entry={{
                id: "resultVariable",
                label: translate("Result Variable"),
                modelProperty: "resultVariable",
                get: function () {
                  let bo = getBusinessObject(element);
                  let boResultVariable = bo.resultVariable;
                  return { resultVariable: boResultVariable };
                },
                set: function (e, values) {
                  if (element.businessObject) {
                    setResultVariable(values.resultVariable);
                    element.businessObject.resultVariable =
                      values.resultVariable || undefined;
                  }
                },
              }}
              canRemove={true}
            />
            {resultVariable && (
              <SelectBox
                element={element}
                entry={{
                  id: "dmn-map-decision-result",
                  label: translate("Map Decision Result"),
                  selectOptions: mapDecisionResultOptions,
                  modelProperty: "mapDecisionResult",
                  get: function () {
                    var bo = getBusinessObject(element);
                    return {
                      mapDecisionResult: bo.mapDecisionResult || "resultList",
                    };
                  },
                  set: function (e, values) {
                    setPropertyValue(
                      "mapDecisionResult",
                      values["mapDecisionResult"]
                    );
                  },
                }}
              />
            )}
          </React.Fragment>
        )}
        {implementationType === "external" && (
          <React.Fragment>
            <TextField
              element={element}
              entry={{
                id: "topic",
                label: translate("Topic"),
                modelProperty: "topic",
                get: function () {
                  let values = {};
                  const bo = getBusinessObject(element);
                  let topic = bo.get("topic");
                  values.topic = topic;
                  return values;
                },

                set: function (element, values) {
                  let topic = values.topic;
                  if (element.businessObject) {
                    element.businessObject.topic = topic;
                    element.businessObject.class = undefined;
                    element.businessObject.expression = undefined;
                    element.businessObject.resultVariable = undefined;
                    element.businessObject.delegateExpression = undefined;
                    element.businessObject.decisionRef = undefined;
                  }
                },
                validate: function (e, values) {
                  if (!values.topic && implementationType === "external") {
                    return { topic: "Must provide a value" };
                  }
                },
              }}
              canRemove={true}
            />
            <React.Fragment>
              {index > 0 && <div className={classes.divider} />}
            </React.Fragment>
            <div className={classes.groupLabel}>
              {translate("External Task Configuration")}
            </div>
            <TextField
              element={element}
              entry={{
                id: "taskPriority",
                label: translate("Task Priority"),
                modelProperty: "taskPriority",
                get: function () {
                  let values = {};
                  const bo = getBusinessObject(element);
                  let boTaskPriority = bo.get("taskPriority");
                  values.taskPriority = boTaskPriority;
                  return values;
                },

                set: function (element, values) {
                  let taskPriority = values.taskPriority;
                  if (element.businessObject) {
                    element.businessObject.taskPriority = taskPriority;
                  }
                },
              }}
              canRemove={true}
            />
          </React.Fragment>
        )}
      </div>
    )
  );
}
