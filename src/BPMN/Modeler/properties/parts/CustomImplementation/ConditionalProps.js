import React, { useEffect, useState } from "react";
import eventDefinitionHelper from "bpmn-js-properties-panel/lib/helper/EventDefinitionHelper";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import { makeStyles } from "@material-ui/core/styles";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";
import { Edit } from "@material-ui/icons";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
} from "@material-ui/core";

import { Textbox } from "../../components";
import { translate, getLowerCase } from "../../../../../utils";
import ExpressionBuilder from "../../../expression-builder";

const useStyles = makeStyles((theme) => ({
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
    borderTop: "1px dotted #ccc",
  },
  newIcon: {
    color: "#58B423",
    marginLeft: 5,
  },
  new: {
    cursor: "pointer",
    marginTop: 18.6,
    display: "flex",
  },
  textbox: {
    width: "100%",
  },
  expressionBuilder: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  save: {
    margin: theme.spacing(1),
    backgroundColor: "#0275d8",
    borderColor: "#0267bf",
    color: "white",
    textTransform: "none",
    "&:hover": {
      backgroundColor: "#025aa5",
      borderColor: "#014682",
      color: "white",
    },
  },
}));

let CONDITIONAL_SOURCES = [
  "bpmn:Activity",
  "bpmn:ExclusiveGateway",
  "bpmn:InclusiveGateway",
  "bpmn:ComplexGateway",
];

function isConditionalSource(element) {
  return isAny(element, CONDITIONAL_SOURCES);
}

const conditionType = "script";

export default function ConditionalProps({
  element,
  index,
  label,
  bpmnFactory,
  bpmnModeler,
}) {
  const [isVisible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [openAlert, setAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [script, setScript] = useState(null);
  const classes = useStyles();

  const handleClickOpen = () => {
    setAlertMessage("Add all values");
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const getProperty = (name) => {
    const bo = getBusinessObject(element);
    return (bo.$attrs && bo.$attrs[name]) || "";
  };

  const setProperty = (name, value) => {
    const bo = getBusinessObject(element);
    if (!bo) return;
    if (bo.$attrs) {
      if (!value) {
        delete bo.$attrs[name];
        return;
      }
      bo.$attrs[name] = value;
    } else {
      if (!value) {
        return;
      }
      bo.$attrs = { [name]: value };
    }
  };

  const setValue = (valExpression) => {
    let expression =
      valExpression && valExpression.replace(/[\u200B-\u200D\uFEFF]/g, "");
    expression =
      !expression || /^\s*$/.test(expression) ? undefined : expression;
    if (element.businessObject && element.businessObject.conditionExpression) {
      element.businessObject.conditionExpression.body = expression
        ? expression
        : undefined;
      element.businessObject.conditionExpression.resource = undefined;
      element.businessObject.conditionExpression.language = "axelor";
      let conditionOrConditionExpression;
      let conditionalEventDefinition = eventDefinitionHelper.getConditionalEventDefinition(
        element
      );
      if (conditionalEventDefinition) {
        element.businessObject.condition = conditionOrConditionExpression;
      } else {
        let bo = getBusinessObject(element);
        const conditionProps = {
          body: "",
          language: "",
          "camunda:resource": undefined,
        };
        conditionOrConditionExpression = elementHelper.createElement(
          "bpmn:FormalExpression",
          conditionProps,
          conditionalEventDefinition || bo,
          bpmnFactory
        );
        element.businessObject.conditionExpression = conditionOrConditionExpression;
        if (conditionOrConditionExpression) {
          element.businessObject.conditionExpression.body = expression;
          element.businessObject.conditionExpression.resource = undefined;
          element.businessObject.conditionExpression.language = "axelor";
        }
      }
      let bo = getBusinessObject(element);
      if (!expression) {
        conditionOrConditionExpression = undefined;
        setProperty("camunda:conditionValue", undefined);
        setProperty("camunda:conditionCombinator", undefined);
      }
      if (!bpmnModeler) return;
      let elementRegistry = bpmnModeler.get("elementRegistry");
      let modeling = bpmnModeler.get("modeling");
      let shape = elementRegistry.get(element.id);
      if (!shape) return;
      if (CONDITIONAL_SOURCES.includes(bo.sourceRef.$type)) return;
      modeling &&
        modeling.updateProperties(shape, {
          [conditionalEventDefinition
            ? "condition"
            : "conditionExpression"]: conditionOrConditionExpression,
        });
    } else {
      let conditionOrConditionExpression;
      let conditionalEventDefinition = eventDefinitionHelper.getConditionalEventDefinition(
        element
      );
      let bo = getBusinessObject(element);
      if (expression && expression !== "" && conditionType) {
        const conditionProps = {
          body: "",
          language: "",
          "camunda:resource": undefined,
        };
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
        if (conditionOrConditionExpression) {
          element.businessObject.conditionExpression.body = expression;
          element.businessObject.conditionExpression.resource = undefined;
          element.businessObject.conditionExpression.language = "axelor";
        }
      }

      if (!expression) {
        conditionOrConditionExpression = undefined;
        setProperty("camunda:conditionValue", undefined);
        setProperty("camunda:conditionCombinator", undefined);
      }
      if (!bpmnModeler) return;
      let elementRegistry = bpmnModeler.get("elementRegistry");
      let modeling = bpmnModeler.get("modeling");
      let shape = elementRegistry.get(element.id);
      if (!shape) return;
      if (CONDITIONAL_SOURCES.includes(bo.sourceRef.$type)) return;
      modeling &&
        modeling.updateProperties(shape, {
          [conditionalEventDefinition
            ? "condition"
            : "conditionExpression"]: conditionOrConditionExpression,
        });
    }
  };

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
        <div className={classes.expressionBuilder}>
          <Textbox
            element={element}
            rows={3}
            className={classes.textbox}
            entry={{
              id: "script",
              label: translate("Script"),
              modelProperty: "script",
              get: function () {
                let bo = getBusinessObject(element);
                if (bo.conditionExpression && bo.conditionExpression.body) {
                  return {
                    script: bo.conditionExpression.body.replace(
                      /[\u200B-\u200D\uFEFF]/g,
                      ""
                    ),
                  };
                }
              },
              set: function (e, values) {
                let bo = getBusinessObject(element);
                if (
                  getLowerCase(values.script) !==
                    getLowerCase(
                      bo.conditionExpression && bo.conditionExpression.body
                    ) &&
                  !getProperty("camunda:conditionValue")
                ) {
                  setValue(script);
                } else {
                  if (
                    getLowerCase(values.script) !==
                    getLowerCase(
                      bo.conditionExpression && bo.conditionExpression.body
                    )
                  ) {
                    setScript(values && values.script);
                    setAlertMessage(
                      "Script can't be managed using builder once changed manually."
                    );
                    setAlertTitle("Warning");
                    setAlert(true);
                  }
                }
              },
            }}
          />
          <div className={classes.new}>
            <Edit className={classes.newIcon} onClick={handleClickOpen} />
            {open && (
              <ExpressionBuilder
                open={open}
                handleClose={() => handleClose()}
                getExpression={() => {
                  const value = getProperty("camunda:conditionValue");
                  const combinator = getProperty("camunda:conditionCombinator");
                  let values;
                  if (value !== undefined) {
                    try {
                      values = JSON.parse(value);
                    } catch (errror) {}
                  }
                  return { values: values, combinator };
                }}
                setProperty={(val) => {
                  const { expression: valExpression, value, combinator } = val;
                  if (value) {
                    setProperty("camunda:conditionValue", value);
                  }
                  if (combinator) {
                    setProperty("camunda:conditionCombinator", combinator);
                  }
                  setValue(valExpression);
                }}
                element={element}
                title="Add Expression"
              />
            )}
          </div>
          {openAlert && (
            <Dialog
              open={openAlert}
              onClose={() => setAlert(false)}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
              classes={{
                paper: classes.dialog,
              }}
            >
              <DialogTitle id="alert-dialog-title">
                {translate(alertTitle)}
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  {translate(alertMessage)}
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => {
                    setAlert(false);
                    setAlertMessage(null);
                    setAlertTitle(null);
                    if (!script && script !== "") return;
                    setValue(script);
                    setScript(null);
                    setProperty("camunda:conditionValue", undefined);
                    setProperty("camunda:conditionCombinator", undefined);
                  }}
                  color="primary"
                  autoFocus
                  className={classes.save}
                >
                  Ok
                </Button>
                <Button
                  onClick={() => {
                    setAlert(false);
                  }}
                  color="primary"
                  className={classes.save}
                >
                  Cancel
                </Button>
              </DialogActions>
            </Dialog>
          )}{" "}
        </div>
      </div>
    )
  );
}
