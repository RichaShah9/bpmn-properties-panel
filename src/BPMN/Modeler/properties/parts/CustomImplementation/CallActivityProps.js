import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { is } from "bpmn-js/lib/util/ModelUtil";

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

export default function CallActivityProps({ element, index, label }) {
  const [isVisible, setVisible] = useState(false);
  const classes = useStyles();

  useEffect(() => {
    if (is(element, "camunda:CallActivity")) {
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
        <div>CallActivity</div>
      </div>
    )
  );
}
