import React, { useEffect, useState } from "react";
import ImplementationTypeHelper from "bpmn-js-properties-panel/lib/helper/ImplementationTypeHelper";
import { makeStyles } from "@material-ui/core/styles";

function isServiceTaskLike(element) {
  return ImplementationTypeHelper.isServiceTaskLike(element);
}

function getBusinessObject(element) {
  return ImplementationTypeHelper.getServiceTaskLikeBusinessObject(element);
}

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

export default function ServiceTaskDelegateProps({ element, index, label }) {
  const [isVisible, setVisible] = useState(false);
  const classes = useStyles();

  useEffect(() => {
    console.log(element);
    if (!isServiceTaskLike(getBusinessObject(element))) {
      setVisible(false);
    }
  }, [element]);

  return (
    isVisible && (
      <div>
        <React.Fragment>
          {index > 0 && <div className={classes.divider} />}
        </React.Fragment>
        <div className={classes.groupLabel}>{label}</div>
        <div>ServiceTaskDelegateProps</div>
      </div>
    )
  );
}
