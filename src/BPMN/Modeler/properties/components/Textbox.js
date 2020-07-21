import React from "react";
import classnames from "classnames";
import Description from "./Description";
import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    marginTop: 20,
  },
  input: {
    "-moz-appearance": "textfield",
    "-webkit-appearance": "textfield",
    backgroundColor: "white",
    border: "1px solid darkgray",
    boxShadow: "1px 1px 1px 0 lightgray inset",
    marginTop: 5,
    padding: "2px 3px",
    minHeight: 16,
    display: "flex",
  },
  resizable: {
    overflowY: "auto",
    resize: "vertical",
  },
  label: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    marginBottom: 3,
  },
});

export default function Textbox({ entry, value, isResizable = false }) {
  const classes = useStyles();
  const { label, description } = entry || {};
  return (
    <div className={classes.root}>
      <label className={classes.label}>{label}</label>
      <div
        contentEditable={true}
        suppressContentEditableWarning={true}
        className={classnames(classes.input, isResizable && classes.resizable)}
      >
        {value}
      </div>
      {description && <Description desciption={description} />}
    </div>
  );
}
