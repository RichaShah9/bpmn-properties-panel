import React, { useEffect, useState } from "react";
import classnames from "classnames";
import TextareaAutosize from "@material-ui/core/TextareaAutosize";
import { makeStyles } from "@material-ui/styles";

import Description from "./Description";
import { getTranslations } from "../../../../services/api";

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
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    resize: "vertical",
    "&:focus": {
      boxShadow: "rgba(82, 180, 21, 0.2) 0px 0px 1px 2px",
      outline: "none",
      borderColor: "rgb(82, 180, 21)",
    },
  },
  error: {
    borderColor: "#cc3333 !important",
    background: "#f0c2c2",
    "&:focus": {
      boxShadow: "rgba(204,58,51, 0.2) 0px 0px 1px 2px !important",
      outline: "none",
      borderColor: "#cc3333 !important",
    },
  },
  readOnly: {
    borderColor: "#ccc !important",
    "&:focus": {
      boxShadow: "none !important",
      outline: "none",
      borderColor: "#ccc !important",
    },
  },
});

export default function Textbox({ entry, element, rows = 1, bpmnModeler }) {
  const classes = useStyles();
  const {
    label,
    description,
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
  const [readOnly, setReadOnly] = useState(false);
  const [translations, setTranslations] = useState(null);

  const updateProperty = (value) => {
    if (!set && !setProperty) return;
    if (set) {
      set(
        element,
        {
          [modelProperty]: value,
        },
        readOnly,
        translations
      );
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
    async function getAllTranslations() {
      if (!element || modelProperty !== "name") return;
      const bo = element.businessObject;
      const name = bo.name;
      const key = bo.$attrs["camunda:key"];
      const value = key || name;
      setValue(value);
      const translations = await getTranslations(value);
      setTranslations(translations);
      if (translations && translations.length > 0) {
        if (value && element.businessObject && element.businessObject.$attrs) {
          element.businessObject.$attrs["camunda:key"] = value;
        }
        setReadOnly(true);
        if (!bpmnModeler) {
          return;
        }
        const directEditing = bpmnModeler.get("directEditing");
        directEditing && directEditing.cancel();
      } else {
        if (key && element.businessObject && element.businessObject.$attrs) {
          element.businessObject.$attrs["camunda:key"] = key;
        }
        setValue(name);
      }
    }
    getAllTranslations();
  }, [element, modelProperty, bpmnModeler]);

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

  return (
    <div className={classes.root}>
      <label className={classes.label}>{label}</label>
      <TextareaAutosize
        id={`camunda_${modelProperty}_${Date()}`}
        value={value || ""}
        className={classnames(
          classes.textarea,
          isError && classes.error,
          readOnly && classes.readOnly
        )}
        rowsMin={rows}
        onBlur={(e) => updateProperty(e.target.value)}
        onChange={(e) => {
          setValue(e.target.value);
        }}
        readOnly={readOnly}
      />
      {errorMessage && <Description desciption={errorMessage} type="error" />}
      {description && <Description desciption={description} />}
    </div>
  );
}
