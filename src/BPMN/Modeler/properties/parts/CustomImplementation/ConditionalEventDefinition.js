import React, { useState, useEffect } from "react";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import { isEventSubProcess } from "bpmn-js/lib/util/DiUtil";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Tooltip,
} from "@material-ui/core";
import { Edit, NotInterested } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";

import ExpressionBuilder from "../../../expression-builder";
import {
  TextField,
  Textbox,
} from "../../../../../components/properties/components";
import { translate } from "../../../../../utils";

const conditionType = "script";

const useStyles = makeStyles((theme) => ({
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

export default function ConditionalEventProps({
  element,
  conditionalEventDefinition,
  bpmnFactory,
}) {
  const [open, setOpen] = useState(false);
  const [openAlert, setAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const classes = useStyles();

  const handleClickOpen = () => {
    setAlertMessage("Add all values");
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const getValue = React.useCallback(
    (modelProperty) => {
      return function (element) {
        let modelPropertyValue = conditionalEventDefinition.get(
          "camunda:" + modelProperty
        );
        let value = {};
        value[modelProperty] = modelPropertyValue;
        return value;
      };
    },
    [conditionalEventDefinition]
  );

  const setValue = (modelProperty) => {
    return function (element, values) {
      let props = {};
      props["camunda:" + modelProperty] = values[modelProperty] || undefined;
      conditionalEventDefinition[modelProperty] = values[modelProperty];
    };
  };

  const getCondition = () => {
    if (conditionalEventDefinition && conditionalEventDefinition.condition) {
      return {
        script: conditionalEventDefinition.condition.body,
      };
    }
  };

  const setCondition = (e, values, scriptValue, combinator) => {
    const bo = getBusinessObject(element);
    if (conditionalEventDefinition) {
      conditionalEventDefinition.condition.body = values.script;
      conditionalEventDefinition.condition.resource = undefined;
      conditionalEventDefinition.condition.language = "axelor";
      setReadOnly(scriptValue ? true : false);
      setValue("scriptValue")(element, { scriptValue });
      setValue("combinator")(element, { combinator });
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
          setReadOnly(scriptValue ? true : false);
          setValue("scriptValue")(element, { scriptValue });
          setValue("combinator")(element, { combinator });
        }
      } else {
        element.businessObject.conditionExpression = conditionOrConditionExpression;
      }
    }
  };

  useEffect(() => {
    const { scriptValue } = getValue("scriptValue")(element);
    setReadOnly(scriptValue ? true : false);
  }, [getValue, element]);

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
      <div className={classes.expressionBuilder}>
        <Textbox
          element={element}
          rows={3}
          className={classes.textbox}
          readOnly={readOnly}
          entry={{
            id: "script",
            label: translate("Script"),
            modelProperty: "script",
            get: function () {
              return getCondition();
            },
            set: function (e, values) {
              setCondition(e, values);
            },
            validate: function (e, values) {
              if (!values.script && conditionType === "script") {
                return { script: "Must provide a value" };
              }
            },
          }}
        />
        {conditionalEventDefinition && (
          <div className={classes.new}>
            <Tooltip title="Enable" aria-label="enable">
              <NotInterested
                className={classes.newIcon}
                onClick={() => {
                  if (readOnly) {
                    setAlertMessage(
                      "Script can't be managed using builder once changed manually."
                    );
                    setAlertTitle("Warning");
                    setAlert(true);
                  }
                }}
              />
            </Tooltip>
            <Edit className={classes.newIcon} onClick={handleClickOpen} />
            {open && (
              <ExpressionBuilder
                open={open}
                isAllowButtons={true}
                handleClose={() => handleClose()}
                getExpression={() => {
                  const { scriptValue: value } = getValue("scriptValue")(
                    element
                  );
                  const { combinator } = getValue("combinator")(element);
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
                  setCondition(
                    undefined,
                    { script: valExpression },
                    value,
                    combinator
                  );
                }}
                element={element}
                title="Add Expression"
              />
            )}
          </div>
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
                setReadOnly(false);
                setValue("scriptValue")(element, { scriptValue: undefined });
                setValue("combinator")(element, { combinator: undefined });
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
      )}
    </div>
  );
}
