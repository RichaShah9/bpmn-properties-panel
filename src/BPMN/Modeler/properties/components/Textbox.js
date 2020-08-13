import React, { useEffect, useState, useRef } from "react";
import classnames from "classnames";
import { makeStyles } from "@material-ui/styles";

import Description from "./Description";

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
  error: {
    borderColor: "#cc3333 !important",
    background: "#f0c2c2",
  },
});

export default function Textbox({ entry, element, rows = 3 }) {
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
    validate,
  } = entry || {};
  const [value, setValue] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isError, setError] = useState(false);
  const textareaRef = useRef(null);

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
    const isError = getValidation();
    setError(isError);
  };

  const getTextareaHeight = () => {
    let currentHeight = textareaRef.current.offsetHeight;
    textareaRef.current.style.minHeight = currentHeight + "px";
    window.removeEventListener("mouseup", getTextareaHeight);
  };

  const handleClick = (e) => {
    window.addEventListener("mouseup", getTextareaHeight);
  };

  const getValidation = React.useCallback(() => {
    if (
      !validate ||
      ((value === null || value === undefined) && modelProperty === "id")
    ) {
      setErrorMessage(null);
      return false;
    }
    let valid = validate(element, {
      [modelProperty]: value === "" ? undefined : value,
    });
    if (valid && valid[modelProperty]) {
      setErrorMessage(valid[modelProperty]);
      return true;
    } else {
      setErrorMessage(null);
      return false;
    }
  }, [validate, element, value, modelProperty]);

  useEffect(() => {
    const isError = getValidation();
    setError(isError);
  }, [getValidation]);

  useEffect(() => {
    if (!element) return;
    const values = get && get(element);
    let value = getProperty
      ? getProperty(element)
      : values && values[modelProperty];
    setValue(value);
  }, [element, modelProperty, get, getProperty]);

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
        className={classnames(classes.textarea, isError && classes.error)}
        rows={rows}
        onMouseDown={handleClick}
        onBlur={(e) => updateProperty(e.target.value)}
        onChange={(e) => {
          setValue(e.target.value);
        }}
      />
      {errorMessage && <Description desciption={errorMessage} type="error" />}
      {description && <Description desciption={description} />}
    </div>
  );
}
