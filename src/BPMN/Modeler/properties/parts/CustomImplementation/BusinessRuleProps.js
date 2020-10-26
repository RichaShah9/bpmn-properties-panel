import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import { Checkbox, SelectBox } from "../../components";
import { translate, getBool } from "../../../../../utils";

const useStyles = makeStyles({
  groupLabel: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    fontSize: "120%",
    margin: "10px 0px",
    transition: "margin 0.218s linear",
    fontStyle: "italic",
  },
  divider: {
    marginTop: 15,
    borderTop: "1px dotted #ccc",
  },
});

export default function BusinessRuleTaskProps({ element, index, label }) {
  const [isVisible, setVisible] = useState(false);
  const [searchWith, setSearchWith] = useState(null);
  const [ifMultiple, setIfMultiple] = useState(null);
  const [assignOutputToFields, setAssignOutputToFields] = useState(null);

  const classes = useStyles();

  const setProperty = (name, value) => {
    const bo = getBusinessObject(element);
    let propertyName = `camunda:${name}`;
    if (!bo) return;
    if (bo.$attrs) {
      bo.$attrs[propertyName] = value;
    } else {
      bo.$attrs = { [propertyName]: value };
    }
    if (!value) {
      delete bo.$attrs[propertyName];
    }
  };

  const getProperty = React.useCallback(
    (name) => {
      let propertyName = `camunda:${name}`;
      const bo = getBusinessObject(element);
      return (bo.$attrs && bo.$attrs[propertyName]) || "";
    },
    [element]
  );

  useEffect(() => {
    const assignOutputToFields = getProperty("assignOutputToFields");
    const searchWith = getProperty("searchWith");
    const ifMultiple = getProperty("ifMultiple");

    setAssignOutputToFields(getBool(assignOutputToFields));
    setIfMultiple(ifMultiple);
    setSearchWith(searchWith);
  }, [getProperty]);

  useEffect(() => {
    if (is(element, "bpmn:BusinessRuleTask")) {
      const bo = getBusinessObject(element);
      if (bo) {
        setVisible(true);
      }
    }
  }, [element]);

  return (
    isVisible && (
      <div>
        <Checkbox
          element={element}
          entry={{
            id: "assign-output-to-fields",
            label: translate("Assign output to fields"),
            modelProperty: "assignOutputToFields",
            widget: "checkbox",
            get: function () {
              return {
                assignOutputToFields: assignOutputToFields,
              };
            },
            set: function (e, value) {
              let assignOutputToFields = !value.assignOutputToFields;
              setAssignOutputToFields(assignOutputToFields);
              setProperty("assignOutputToFields", assignOutputToFields);
            },
          }}
        />
        {assignOutputToFields && (
          <React.Fragment>
            <React.Fragment>
              {index > 0 && <div className={classes.divider} />}
            </React.Fragment>
            <div className={classes.groupLabel}>
              {translate("Relational field search")}
            </div>
            <SelectBox
              element={element}
              entry={{
                id: "searchWith",
                label: "Search with",
                modelProperty: "searchWith",
                selectOptions: [
                  { name: "Equal", value: "Equal" },
                  { name: "Like", value: "Like" },
                ],
                emptyParameter: true,
                get: function () {
                  return { searchWith: searchWith };
                },
                set: function (e, value) {
                  let searchWith = value.searchWith;
                  setSearchWith(searchWith);
                  setProperty("searchWith", searchWith);
                },
              }}
            />
            <SelectBox
              element={element}
              entry={{
                id: "ifMultiple",
                label: "If multiple",
                modelProperty: "ifMultiple",
                selectOptions: [
                  { name: "Keep empty", value: "Keep empty" },
                  { name: "Select first", value: "Select first" },
                ],
                emptyParameter: true,
                get: function () {
                  return { ifMultiple: ifMultiple };
                },
                set: function (e, value) {
                  let ifMultiple = value.ifMultiple;
                  setIfMultiple(ifMultiple);
                  setProperty("ifMultiple", ifMultiple);
                },
              }}
            />
          </React.Fragment>
        )}
      </div>
    )
  );
}
