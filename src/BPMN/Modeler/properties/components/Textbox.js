import React, { useEffect, useState, useRef } from "react";
import Description from "./Description";
import { makeStyles } from "@material-ui/styles";

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
  textarea: {
    display: "block",
    overflow: "hidden",
    width: "100%",
    overflowY: "auto",
    resize: "vertical",
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
  },
});

export default function Textbox({ entry, element, rows = 1 }) {
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

  const updateProperty = (value) => {
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

  const textareaRef = useRef(null);

  const getTextareaHeight = () => {
    let currentHeight = textareaRef.current.offsetHeight;
    textareaRef.current.style.minHeight = currentHeight + "px";
    window.removeEventListener("mouseup", getTextareaHeight);
  };

  const handleClick = (e) => {
    window.addEventListener("mouseup", getTextareaHeight);
  };

  useEffect(() => {
    textareaRef.current.style.height = "0px";
    const scrollHeight = textareaRef.current.scrollHeight;
    textareaRef.current.style.height = scrollHeight + "px";
  }, [value]);

  return (
    <div className={classes.root}>
      <label className={classes.label}>{label}</label>
      <textarea
        id={`camunda_name_${id}`}
        ref={textareaRef}
        defaultValue={value}
        className={classes.textarea}
        rows={rows}
        onMouseDown={handleClick}
        onBlur={(e) => updateProperty(e.target.value)}
        onChange={(e) => {
          setValue(e.target.value);
        }}
      />
      {description && <Description desciption={description} />}
    </div>
  );
}
