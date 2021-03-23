import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { Edit } from "@material-ui/icons";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
} from "@material-ui/core";

import TextField from "../../components/TextField";
import ExpressionBuilder from "../../../expression-builder";
import Select from "../../../../../components/Select";
import { getButtons } from "../../../../../services/api";
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
    borderTop: "1px dotted #ccc",
  },
  expressionBuilder: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  newIcon: {
    color: "#58B423",
    marginLeft: 5,
  },
  new: {
    cursor: "pointer",
  },
  dialog: {
    minWidth: 300,
  },
  label: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    margin: "3px 0px",
  },
  allButtons: {
    paddingBottom: 10,
  },
  select: {
    margin: 0,
  },
});

export default function UserTaskProps({ element, index, label }) {
  const [isVisible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [openAlert, setAlert] = useState(false);
  const [buttons, setButtons] = useState(null);
  const classes = useStyles();

  const openAlertDialog = () => {
    setAlert(true);
  };

  const getProperty = React.useCallback(
    (name) => {
      const bo = getBusinessObject(element);
      return (bo.$attrs && bo.$attrs[name]) || "";
    },
    [element]
  );

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const addButtons = (values) => {
    const buttons = [];
    const buttonLabels = [];
    if (Array.isArray(values)) {
      if (values && values.length === 0) {
        setProperty("camunda:buttons", undefined);
        setProperty(`camunda:buttonLabels`, undefined);
        return;
      }
      values &&
        values.forEach((value) => {
          if (!value) {
            setProperty("camunda:buttons", undefined);
            setProperty(`camunda:buttonLabels`, undefined);
            return;
          }
          buttons.push(value.name);
          buttonLabels.push(value.title);
        });
    }
    if (buttons.length > 0) {
      setProperty(`camunda:buttonLabels`, buttonLabels.toString());
      setProperty("camunda:buttons", buttons.toString());
    }
  };

  function getProcessConfig() {
    const model = getProperty("camunda:metaModel");
    const jsonModel = getProperty("camunda:metaJsonModel");
    if (model) {
      return [{ model, type: "metaModel" }];
    } else if (jsonModel) {
      return [{ model: jsonModel, type: "metaJsonModel" }];
    } else {
      let bo =
        element && element.businessObject && element.businessObject.$parent;
      if (element.type === "bpmn:Process") {
        bo = element.businessObject;
      }
      if (
        (element && element.businessObject && element.businessObject.$type) ===
        "bpmn:Participant"
      ) {
        bo =
          element &&
          element.businessObject &&
          element.businessObject.processRef;
      }
      const extensionElements = bo && bo.extensionElements;
      if (!extensionElements || !extensionElements.values) return [];
      const processConfigurations = extensionElements.values.find(
        (e) => e.$type === "camunda:ProcessConfiguration"
      );
      const models = [];
      if (
        !processConfigurations &&
        !processConfigurations.processConfigurationParameters
      )
        return [];
      processConfigurations.processConfigurationParameters.forEach((config) => {
        if (config.metaModel) {
          models.push({
            model: config.metaModel,
            type: "metaModel",
            modelFullName: config.model,
          });
        } else if (config.metaJsonModel) {
          models.push({ model: config.metaJsonModel, type: "metaJsonModel" });
        }
      });
      return models;
    }
  }

  const setProperty = (name, value) => {
    const bo = getBusinessObject(element);
    if (!bo) return;
    if (bo.$attrs) {
      bo.$attrs[name] = value;
    } else {
      bo.$attrs = { [name]: value };
    }
  };

  useEffect(() => {
    if (is(element, "bpmn:UserTask")) {
      setVisible(true);
    }
  }, [element]);

  useEffect(() => {
    const buttonsProperty = getProperty("camunda:buttons");
    const buttonLabelsProperty = getProperty("camunda:buttonLabels");
    const buttons = [];
    if (buttonsProperty) {
      const names = buttonsProperty && buttonsProperty.split(",");
      const labels = buttonLabelsProperty && buttonLabelsProperty.split(",");
      names &&
        names.forEach((name, i) => {
          buttons.push({
            name: name,
            title: labels && labels[i],
          });
        });
      setButtons(buttons);
    }
  }, [getProperty]);

  return (
    isVisible && (
      <div>
        <React.Fragment>
          {index > 0 && <div className={classes.divider} />}
        </React.Fragment>
        <div className={classes.groupLabel}>{label}</div>
        <div className={classes.expressionBuilder}>
          <TextField
            element={element}
            entry={{
              id: "completedIf",
              label: translate("Completed If"),
              modelProperty: "completedIf",
              get: function () {
                let completedIf = getProperty("camunda:completedIf");
                completedIf = (completedIf || "").replace(
                  /[\u200B-\u200D\uFEFF]/g,
                  ""
                );
                return {
                  completedIf,
                };
              },
              set: function (e, values) {
                let oldVal = getProperty("camunda:completedIf");
                let currentVal = values["completedIf"];
                (currentVal || "").replace(/[\u200B-\u200D\uFEFF]/g, "");
                setProperty("camunda:completedIf", currentVal);
                if (
                  (oldVal && oldVal.trim().toLowerCase()) !==
                  (currentVal && currentVal.trim().toLowerCase())
                ) {
                  setProperty("camunda:completedIfValue", undefined);
                  setProperty("camunda:completedIfCombinator", undefined);
                }
              },
            }}
            canRemove={true}
          />
          <div className={classes.new}>
            <Edit className={classes.newIcon} onClick={handleClickOpen} />
            <ExpressionBuilder
              open={open}
              handleClose={() => handleClose()}
              openAlertDialog={openAlertDialog}
              getExpression={() => {
                const value = getProperty("camunda:completedIfValue");
                const combinator = getProperty("camunda:completedIfCombinator");
                let values;
                if (value !== undefined) {
                  try {
                    values = JSON.parse(value);
                  } catch (errror) {}
                }
                return { values: values, combinator };
              }}
              setProperty={(val) => {
                const { expression, value, combinator } = val;
                setProperty("camunda:completedIf", expression);
                if (value) {
                  setProperty("camunda:completedIfValue", value);
                }
                if (combinator) {
                  setProperty("camunda:completedIfCombinator", combinator);
                }
              }}
              element={element}
              title="Add Expression"
            />
          </div>
          <Dialog
            open={openAlert}
            onClose={() => setAlert(false)}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            classes={{
              paper: classes.dialog,
            }}
          >
            <DialogTitle id="alert-dialog-title">Error</DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                Add all values
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAlert(false)} color="primary" autoFocus>
                Ok
              </Button>
            </DialogActions>
          </Dialog>
        </div>
        <div className={classes.allButtons}>
          <label className={classes.label}>{translate("Buttons")}</label>
          <Select
            className={classes.select}
            update={(value) => {
              setButtons(value);
              addButtons(value);
            }}
            fetchMethod={() => getButtons(getProcessConfig())}
            name="buttons"
            value={buttons || []}
            multiple={true}
            isLabel={false}
          />
        </div>
      </div>
    )
  );
}
