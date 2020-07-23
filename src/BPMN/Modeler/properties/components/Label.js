import React from "react";
import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    marginTop: 5,
  },
});

export default function Label({ entry }) {
  const classes = useStyles();
  const { label } = entry || {};

  return (
    <div className={classes.root}>
      <label className="entry-label">{label}</label>
    </div>
  );
}
