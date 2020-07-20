import React from "react";
import Tooltip from "@material-ui/core/Tooltip";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  arrow: {
    color: theme.palette.common.black,
  },
  tooltip: {
    backgroundColor: theme.palette.common.black,
    fontSize: "1em",
  },
}));

export default function BootstrapTooltip({ title, children }) {
  const classes = useStyles();
  return (
    <Tooltip arrow classes={classes} title={title}>
      {children}
    </Tooltip>
  );
}
