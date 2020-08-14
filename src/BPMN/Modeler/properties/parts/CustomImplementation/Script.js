import React, { useEffect, useState } from "react";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import { TextField, SelectBox, Textbox } from "../../components";
import { translate } from "../../../../../utils";

export default function Script({ element }) {
  const [scriptType, setScriptType] = useState("script");

  useEffect(() => {
    let bo = getBusinessObject(element);
    let type = "script";
    if (bo.resource || bo.resource === "") {
      type = "scriptResource";
    }
    setScriptType(type);
  }, [element]);

  return (
    <div>
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
            validate: function (e, values) {
              if (!values.resource && scriptType === "scriptResource") {
                return { resource: "Must provide a value" };
              }
            },
          }}
          canRemove={true}
        />
      )}
      {scriptType === "script" && (
        <Textbox
          element={element}
          rows={3}
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
            validate: function (e, values) {
              if (!values.script && scriptType === "script") {
                return { script: "Must provide a value" };
              }
            },
          }}
          rows={2}
        />
      )}
    </div>
  );
}
