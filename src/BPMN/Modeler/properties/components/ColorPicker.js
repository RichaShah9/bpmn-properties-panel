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
  FF7043: "#FF7043",
  "5FC34C": "#5FC34C",
  F9C000: "#F9C000",
  F8B200: "#F8B200",
  "3FBDD6": "#3FBDD6",
  "3F97F6": "#3F97F6",
  FF9E0F: "#FF9E0F",
  F79000: "#F79000",
  E76092: "#E76092",
  B567CA: "#B567CA",
  "3EBFA5": "#3EBFA5",
  FBA729: "#FBA729",
  "3FC84C": "#3FC84C",
  E4EBF8: "#E4EBF8",
  "8ECB60": "#8ECB60",
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
