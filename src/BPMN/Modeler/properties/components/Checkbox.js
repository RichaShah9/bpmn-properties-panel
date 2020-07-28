import React, { useEffect, useState } from "react";
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
  const { id, label, modelProperty, get, set } = entry || {};
  const [value, setValue] = useState(false);

  const updateValue = () => {
    setValue((value) => !value);
    set(element, { [modelProperty]: value });
  };

  useEffect(() => {
    if (!element || !get) return;
    const values = get && get(element);
    let value = values && values[modelProperty];
    setValue(value || false);
  }, [element, modelProperty, get]);

  return (
    <div className={classes.root}>
      <input
        id={`camunda-${id}`}
        type="checkbox"
        name={modelProperty}
        checked={value}
        onChange={updateValue}
      />
      <label htmlFor={`camunda-${id}`}>{label}</label>
    </div>
  );
}
