import React, { useState } from "react";
import { makeStyles } from "@material-ui/styles";
import utils from "bpmn-js-properties-panel/lib/Utils";

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

export default function CustomSelectBox({ entry, element }) {
  const classes = useStyles();
  const { label, canBeHidden, id, selectElement, newElementIdPrefix } =
    entry || {};

  const [options, setOptions] = useState(null);

  const addElement = () => {
    let prefix = newElementIdPrefix || "elem_";
    let id = utils.nextId(prefix);
    setOptions([...(options || []), id]);
  };

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
            data-list-entry-container
            onChange={() => selectElement(element)}
          >
            {options &&
              options.length > 0 &&
              options.map((option) => <option key={option}>{option}</option>)}
          </select>
          <button
            className={classes.add}
            id={`cam-extensionElements-create-${id}`}
            onClick={addElement}
          >
            <span>+</span>
          </button>
        </div>
      </div>
    </div>
  );
}
