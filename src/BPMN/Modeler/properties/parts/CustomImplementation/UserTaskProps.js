import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { Add } from "@material-ui/icons";

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
    color: "#0075FF",
    marginLeft: 5,
  },
  new: {
    cursor: "pointer",
  },
});

export default function UserTaskProps({ element, index, label }) {
  const [isVisible, setVisible] = useState(false);
  const [open, setOpen] = React.useState(false);
  const classes = useStyles();

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
                setProperty("camunda:completedIf", values["completedIf"]);
              },
            }}
            canRemove={true}
          />
          <div className={classes.new}>
            <Add className={classes.newIcon} onClick={handleClickOpen} />
            <ExpressionBuilder
              open={open}
              handleClose={() => handleClose()}
              setProperty={(value) => {
                setProperty("camunda:completedIf", value);
              }}
              element={element}
            />
          </div>
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
