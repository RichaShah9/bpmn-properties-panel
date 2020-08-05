import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";

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

export default function EventProps({ element, index, label }) {
  const [isVisible, setVisible] = useState(false);
  const classes = useStyles();

  return (
    isVisible && (
      <div>
        <React.Fragment>
          {index > 0 && <div className={classes.divider} />}
        </React.Fragment>
        <div className={classes.groupLabel}>{label}</div>
        <div>EventProps</div>
      </div>
    )
  );
}
