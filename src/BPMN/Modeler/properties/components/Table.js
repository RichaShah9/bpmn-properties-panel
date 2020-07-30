import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/styles";
import _ from "lodash";
const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    marginTop: 5,
  },
  add: {
    marginLeft: 10,
    backgroundColor: "#f8f8f8",
    border: "1px solid #ccc",
    height: 23,
    width: 24,
    overflow: "hidden",
    cursor: "pointer",
  },
  clear: {
    height: 23,
    width: 24,
    overflow: "hidden",
    cursor: "pointer",
    backgroundColor: "#f8f8f8",
    border: "1px solid #ccc",
  },
  label: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    marginBottom: 3,
  },
});

//TODO - add entry
export default function Table({ entry }) {
  const classes = useStyles();
  const {
    id,
    addLabel,
    labels,
    addElement,
    showDefaultEntry,
    modelProperties,
    getElements,
    removeElement,
    updateElement,
    validate,
  } = entry || {};
  const [options, setOptions] = useState(null);
  const [errors, setErrors] = useState({});

  const getOptions = React.useCallback(() => {
    const options = getElements && getElements();
    if (id === "form-field-enum-values" || id === "form-field-properties") {
      setOptions(_.uniqBy([...(options || [])], "id"));
    } else {
      setOptions([...(options || [])]);
    }
  }, [getElements, id]);

  const addNewElement = () => {
    let element = addElement();
    if (id === "form-field-enum-values" || id === "form-field-properties") {
      setOptions(_.uniqBy([...(options || []), element], "id"));
    } else {
      setOptions([...(options || []), element]);
    }
  };

  useEffect(() => {
    getOptions();
  }, [getOptions]);

  return (
    <div className={classes.root}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <label className={classes.label}>{addLabel}</label>
        <button
          className={classes.add}
          id={`cam-extensionElements-create-${id}`}
          onClick={addNewElement}
        >
          <span>+</span>
        </button>
      </div>
      {(showDefaultEntry || (options && options.length > 0)) && (
        <table>
          <tbody>
            <tr
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "space-between",
              }}
            >
              {labels.map((label) => (
                <th key={label}>{label}</th>
              ))}
              <th key="add"></th>
            </tr>
            {options &&
              options.map((option, optionIndex) => (
                <tr key={`${option}_${optionIndex}`}>
                  <React.Fragment>
                    {modelProperties &&
                      modelProperties.map((label, index) => (
                        <td key={`${option[label]}_${index}`}>
                          <input
                            type="text"
                            defaultValue={option[label] || ""}
                            style={{ width: "100%" }}
                            onBlur={(e) => {
                              let isValid =
                                validate &&
                                validate(e.target.value, optionIndex);
                              if (isValid) {
                                updateElement(
                                  e.target.value,
                                  label,
                                  option,
                                  optionIndex
                                );
                              }
                            }}
                          />
                        </td>
                      ))}
                    <td>
                      <button
                        className={classes.clear}
                        id={`cam-extensionElements-remove-${id}`}
                        onClick={() => {
                          removeElement(option, optionIndex);
                          getOptions();
                        }}
                      >
                        <span style={{ fontSize: 10 }}>X</span>
                      </button>
                    </td>
                  </React.Fragment>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
