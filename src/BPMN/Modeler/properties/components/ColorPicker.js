import React, { useEffect, useState } from "react";
import { ColorPicker } from "material-ui-color";
import { makeStyles } from "@material-ui/styles";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

const useStyles = makeStyles({
  root: {
    marginTop: 8,
  },
  label: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    marginBottom: 3,
  },
});

const palette = {
  red: "#ff0000",
  blue: "#0000ff",
  green: "#00ff00",
  yellow: "yellow",
  cyan: "cyan",
  lime: "lime",
  gray: "gray",
  orange: "orange",
  purple: "purple",
  black: "black",
  white: "white",
  pink: "pink",
  darkblue: "darkblue",
};

export default function ColorPickerComponent({ changeColor, entry, element }) {
  const [color, setColor] = useState("#fff");
  const { label = "" } = entry || {};
  const classes = useStyles();

  const handleChange = (newValue) => {
    setColor(newValue);
    if (newValue && newValue.css && newValue.css.backgroundColor) {
      changeColor(newValue.css.backgroundColor);
    }
  };

  useEffect(() => {
    const bo = getBusinessObject(element);
    const color = bo && bo.di && bo.di.fill;
    if (!color) return;
    setColor(color);
  }, [element]);

  return (
    <div className={classes.root}>
      <label className={classes.label}>{label}</label>
      <ColorPicker
        value={color}
        deferred
        hideTextfield
        palette={palette}
        onChange={handleChange}
      />
    </div>
  );
}
