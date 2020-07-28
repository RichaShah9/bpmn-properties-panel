import React, { useEffect, useState } from "react";
import classnames from "classnames";
import Description from "./Description";
import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    marginTop: 5,
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

export default function Textbox({ entry, element, isResizable = false }) {
  const classes = useStyles();
  const {
    label,
    description,
    id,
    get,
    set,
    modelProperty,
    getProperty,
    setProperty,
  } = entry || {};
  const [value, setValue] = useState(null);

  const updateProperty = () => {
    const value = document.getElementById(`camunda_name_${id}`).innerHTML
    if (!set && !setProperty) return;
    if (set) {
      set(element, {
        [modelProperty]: value,
      });
      setValue(value);
    } else {
      setProperty(element, {
        [modelProperty]: value,
      });
      setValue(value);
    }
  };

  useEffect(() => {
    if (!element) return;
    const values = get && get(element);
    let value = getProperty
      ? getProperty(element)
      : values && values[modelProperty];
    setValue(value);
  }, [element, modelProperty, get, getProperty]);

  return (
    <div className={classes.root}>
      <label className={classes.label}>{label}</label>
      <div
        id={`camunda_name_${id}`}
        contentEditable={true}
        suppressContentEditableWarning={true}
        className={classnames(classes.input, isResizable && classes.resizable)}
        onBlur={updateProperty}
      >
        {value}
      </div>
      {description && <Description desciption={description} />}
    </div>
  );
}
