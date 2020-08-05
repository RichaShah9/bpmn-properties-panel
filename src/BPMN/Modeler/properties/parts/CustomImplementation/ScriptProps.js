import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import Script from "./Script";
import { TextField } from "../../components";
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
  groupContainer: {
    marginTop: 10,
  },
  divider: {
    marginTop: 15,
    border: "1px dotted #ccc",
  },
});

export default function ScriptProps({ element, index, label }) {
  const [isVisible, setVisible] = useState(false);
  const classes = useStyles();

  useEffect(() => {
    if (is(element, "bpmn:ScriptTask")) {
      const bo = getBusinessObject(element);
      if (bo) {
        setVisible(true);
      }
    }
  }, [element]);

  return (
    isVisible && (
      <div>
        <React.Fragment>
          {index > 0 && <div className={classes.divider} />}
        </React.Fragment>
        <div className={classes.groupLabel}>{label}</div>
        <Script element={element} />
        <TextField
          element={element}
          entry={{
            id: "scriptResultVariable",
            label: translate("Result Variable"),
            modelProperty: "scriptResultVariable",
            get: function () {
              let bo = getBusinessObject(element);
              let boResultVariable = bo.get("camunda:resultVariable");
              return { scriptResultVariable: boResultVariable };
            },
            set: function (e, values) {
              if (element.businessObject) {
                element.businessObject.resultVariable =
                  values.scriptResultVariable || undefined;
              }
            },
          }}
          canRemove={true}
        />
      </div>
    )
  );
}
