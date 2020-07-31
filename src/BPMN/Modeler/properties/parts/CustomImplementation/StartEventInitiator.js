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

export default function StartEventInitiator({ element, index, label }) {
  const [isVisible, setVisible] = useState(false);
  const classes = useStyles();

  useEffect(() => {
    if (
      is(element, "camunda:Initiator") &&
      !is(element.parent, "bpmn:SubProcess")
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
        <TextField
          element={element}
          entry={{
            id: "initiator",
            label: translate("Initiator"),
            modelProperty: "initiator",
            get: function () {
              const bo = getBusinessObject(element);
              return { initiator: bo.get("initiator") };
            },
            set: function (element, values) {
              element.businessObject.initiator = values["initiator"];
            },
          }}
          canRemove={true}
        />
      </div>
    )
  );
}
