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
  dialog:{
    minWidth: 300
  }
});

export default function UserTaskProps({ element, index, label }) {
  const [isVisible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [openAlert, setAlert] = useState(false);
  const classes = useStyles();

  const openAlertDialog = () => {
    setAlert(true);
  };

  const getProperty = (name) => {
    const bo = getBusinessObject(element);
    return (bo.$attrs && bo.$attrs[name]) || "";
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

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
                return {
                  completedIf: getProperty("camunda:completedIf"),
                };
              },
              set: function (e, values) {
                let oldVal = getProperty("camunda:completedIf");
                let currentVal = values["completedIf"];
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
        <TextField
          element={element}
          entry={{
            id: "buttons",
            label: translate("Buttons"),
            modelProperty: "buttons",
            get: function () {
              return {
                buttons: getProperty("camunda:buttons"),
              };
            },
            set: function (e, values) {
              setProperty("camunda:buttons", values["buttons"]);
            },
          }}
          canRemove={true}
        />
      </div>
    )
  );
}
