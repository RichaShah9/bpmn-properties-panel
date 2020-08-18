import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import TextField from "../../components/TextField";
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

export default function UserTaskProps({ element, index, label }) {
  const [isVisible, setVisible] = useState(false);
  const classes = useStyles();

  const getProperty = (name) => {
    const bo = getBusinessObject(element);
    return (bo.$attrs && bo.$attrs[name]) || "";
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
