import React from "react";
import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    marginTop: 10,
  },
  extensionElements: {
    width: "100%",
  },
  label: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    marginBottom: 3,
  },
  add: {
    top: "-23px !important",
    position: "absolute",
    height: 23,
    width: 24,
    overflow: "hidden",
    cursor: "pointer",
    backgroundColor: "#f8f8f8",
    border: "1px solid #ccc",
    borderBottom: "none",
    right: 0,
  },
  clear: {
    top: "-23px !important",
    position: "absolute",
    height: 23,
    width: 24,
    overflow: "hidden",
    cursor: "pointer",
    backgroundColor: "#f8f8f8",
    border: "1px solid #ccc",
    borderBottom: "none",
    right: 23,
  },
  container: {
    position: "relative",
  },
});

export default function ExtensionElementTable({ entry, element }) {
  const classes = useStyles();
  const {
    label,
    canBeHidden,
    defaultSize = 5,
    id,
    removeElement,
    createElement,
    selectElement,
  } = entry || {};

  return (
    <div className={classes.root}>
      <div
        className="bpp-row bpp-element-list"
        data-show={canBeHidden ? "hideElements" : ""}
      >
        <label
          htmlFor={`cam-extensionElements-${id}`}
          className={classes.label}
        >
          {label}
        </label>
        <div className={classes.container}>
          <select
            id={`cam-extensionElements-${id}`}
            className={classes.extensionElements}
            name="selectedExtensionElement"
            size={defaultSize}
            data-list-entry-container
            onChange={() => selectElement(element)}
          ></select>
          <button
            className={classes.add}
            id={`cam-extensionElements-create-${id}`}
            onClick={() => createElement(element)}
          >
            <span>+</span>
          </button>
          <button
            className={classes.clear}
            id={`cam-extensionElements-remove-${id}`}
            onClick={() => removeElement(element)}
          >
            <span style={{ fontSize: 10 }}>X</span>
          </button>
        </div>
      </div>
    </div>
  );
}
