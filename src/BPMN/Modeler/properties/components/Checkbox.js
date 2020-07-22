import React from "react";
import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles({
  root: {
    display: "flex",
    alignItems: "center",
    marginTop: 5,
  },
});

export default function Checkbox({ entry, element }) {
  const classes = useStyles();
  const { id, canBeDisabled, canBeHidden, label, modelProperty } = entry || {};

  return (
    <div className={classes.root}>
      <input
        id={`camunda-${id}`}
        type="checkbox"
        name={modelProperty}
        data-disable={canBeDisabled ? "isDisabled" : ""}
        data-show={canBeHidden ? "isHidden" : ""}
      />
      <label
        htmlFor={`camunda-${id}`}
        data-disable={canBeDisabled ? "isDisabled" : ""}
        data-show={canBeHidden ? "isHidden" : ""}
      >
        {label}
      </label>
    </div>
  );
}
