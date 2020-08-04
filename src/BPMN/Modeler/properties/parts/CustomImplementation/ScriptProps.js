import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import { TextField, SelectBox, Textbox } from "../../components";
import { translate } from "../../../../../utils";

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
  groupContainer: {
    marginTop: 10,
  },
  divider: {
    marginTop: 15,
    border: "1px dotted #ccc",
  },
});

export default function ScriptProps({ element, index, label }) {
  const [isVisible, setVisible] = useState(false);
  const [scriptType, setScriptType] = useState("script");
  const classes = useStyles();

  useEffect(() => {
    if (is(element, "bpmn:ScriptTask")) {
      const bo = getBusinessObject(element);
      if (bo) {
        setVisible(true);
      }
    }
  }, [element]);

  useEffect(() => {
    let bo = getBusinessObject(element);
    let type = "script";
    if (bo.resource || bo.resource === "") {
      type = "scriptResource";
    }
    setScriptType(type);
  }, [element]);

  return (
    isVisible && (
      <div>
        <React.Fragment>
          {index > 0 && <div className={classes.divider} />}
        </React.Fragment>
        <div className={classes.groupLabel}>{label}</div>
        <TextField
          element={element}
          entry={{
            id: "scriptFormat",
            label: translate("Script Format"),
            modelProperty: "scriptFormat",
            get: function () {
              let values = {};
              const bo = getBusinessObject(element);
              let boScriptFormat = bo.get("scriptFormat");
              values.scriptFormat = boScriptFormat;
              return values;
            },

            set: function (element, values) {
              let scriptFormat = values.scriptFormat;
              if (element.businessObject) {
                element.businessObject.scriptFormat = scriptFormat;
              }
            },
          }}
          canRemove={true}
        />
        <SelectBox
          element={element}
          entry={{
            id: "scriptType",
            label: "Script Type",
            modelProperty: "scriptType",
            selectOptions: [
              { name: "Inline Script", value: "script" },
              { name: "External Resource", value: "scriptResource" },
            ],
            emptyParameter: false,
            get: function () {
              return { scriptType: scriptType };
            },
            set: function (e, values) {
              if (values && !values.scriptType) return;
              setScriptType(values.scriptType);
              if (values.scriptType === "script") {
                if (element.businessObject) {
                  element.businessObject.resource = undefined;
                  element.businessObject.script = "";
                }
              } else {
                if (element.businessObject) {
                  element.businessObject.resource = "";
                  element.businessObject.script = undefined;
                }
              }
            },
          }}
        />
        {scriptType === "scriptResource" && (
          <TextField
            element={element}
            entry={{
              id: "resource",
              label: translate("Resource"),
              modelProperty: "resource",
              get: function () {
                let bo = getBusinessObject(element);
                return { resource: bo.get("resource") };
              },
              set: function (e, values) {
                if (element.businessObject) {
                  element.businessObject.resource = values.resource;
                  element.businessObject.script = undefined;
                }
              },
            }}
            canRemove={true}
          />
        )}
        {scriptType === "script" && (
          <Textbox
            element={element}
            entry={{
              id: "script",
              label: translate("Script"),
              modelProperty: "script",
              get: function () {
                let bo = getBusinessObject(element);
                return { script: bo.get("script") };
              },
              set: function (e, values) {
                if (element.businessObject) {
                  element.businessObject.script = values.script;
                  element.businessObject.resource = undefined;
                }
              },
            }}
            rows={2}
          />
        )}
        <TextField
          element={element}
          entry={{
            id: "scriptResultVariable",
            label: translate("Result Variable"),
            modelProperty: "scriptResultVariable",
            get: function () {
              let bo = getBusinessObject(element);
              let boResultVariable = bo.get("camunda:resultVariable");
              return { scriptResultVariable: boResultVariable };
            },
            set: function (e, values) {
              if (element.businessObject) {
                element.businessObject.resultVariable =
                  values.scriptResultVariable || undefined;
              }
            },
          }}
          canRemove={true}
        />
      </div>
    )
  );
}
