import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/styles";

import Description from "./Description";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    marginTop: 5,
  },
});

export default function SelectBox({ entry, element }) {
  const classes = useStyles();
  const {
    id,
    emptyParameter,
    selectOptions,
    canBeDisabled,
    canBeHidden,
    label,
    modelProperty,
    description,
  } = entry || {};
  const [options, setOptions] = useState([]);

  useEffect(() => {
    if (typeof selectOptions === "object") {
      setOptions(selectOptions);
    } else {
      let dynamicOptions = selectOptions(element);
      if (dynamicOptions) {
        setOptions(dynamicOptions);
      }
    }
  }, [selectOptions, element]);

  return (
    <div className={classes.root}>
      <label
        htmlFor={`camunda-${id}`}
        data-disable={canBeDisabled ? "isDisabled" : ""}
        data-show={canBeHidden ? "isHidden" : ""}
      >
        {label}
      </label>
      <select
        id={`camunda-${id}-select`}
        name={modelProperty}
        data-disable={canBeDisabled ? "isDisabled" : ""}
        data-show={canBeHidden ? "isHidden" : ""}
      >
        {emptyParameter && <option value=""></option>}
        {options &&
          options.map((option, index) => (
            <option value={option.value} key={index}>
              {option.name ? option.name : ""}{" "}
            </option>
          ))}
      </select>
      {description && <Description desciption={description} />}
    </div>
  );
}
