import React from "react";
import { makeStyles } from "@material-ui/styles";

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
  const { addLabel, labels, id } = entry || {};
  
  return (
    <div className={classes.root}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <label className={classes.label}>{addLabel}</label>
        <button
          className={classes.add}
          id={`cam-extensionElements-create-${id}`}
        //   onClick={() => addElement(element)}
        >
          <span>+</span>
        </button>
      </div>
      <table>
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
        <tr>
          {labels.map((label) => (
            <td key={`${label}_data`}>
              <input type="text" style={{ width: "100%" }} />
            </td>
          ))}
          <td>
            <button
              className={classes.clear}
              id={`cam-extensionElements-remove-${id}`}
              onClick={() => {}}
            >
              <span style={{ fontSize: 10 }}>X</span>
            </button>
          </td>
        </tr>
      </table>
    </div>
  );
}
