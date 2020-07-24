import React, { useState, useEffect } from "react";
import Description from "./Description";
import { makeStyles } from "@material-ui/styles";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { Close } from "@material-ui/icons";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    marginTop: 5,
  },
  label: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    marginBottom: 3,
  },
  fieldWrapper: {
    position: "relative",
  },
  input: {
    width: "calc(100% - 35px)",
    padding: "3px 28px 3px 6px ",
    border: "1px solid #ccc",
  },
  clearButton: {
    background: "transparent",
    border: "none",
    top: 0,
    right: 0,
    position: "absolute",
    height: 23,
    width: 24,
    overflow: "hidden",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
});

export default function Textbox({ entry, element, canRemove = false }) {
  const classes = useStyles();
  const { label, description, id } = entry || {};
  const [value, setValue] = useState(null);

  useEffect(() => {
    if (!element) return;
    if (element[id]) {
      setValue(element[id]);
    } else {
      let bo = getBusinessObject(element);
      setValue(bo && bo[id]);
    }
  }, [element, id]);

  return (
    <div className={classes.root}>
      <label className={classes.label}>{label}</label>
      <div className={classes.fieldWrapper}>
        <input
          id={`camunda-${id}`}
          type="text"
          name={id}
          value={value || ""}
          onChange={(e) => setValue(e.target.value)}
          className={classes.input}
        />
        {canRemove && value && (
          <button
            onClick={() => {
              setValue(null);
            }}
            className={classes.clearButton}
          >
            <Close fontSize="small" />
          </button>
        )}
      </div>
      {description && <Description desciption={description} />}
    </div>
  );
}
