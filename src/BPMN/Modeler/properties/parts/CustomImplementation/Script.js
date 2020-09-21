import React from "react";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import { TextField, Textbox } from "../../components";
import { translate } from "../../../../../utils";

export default function Script({ element }) {
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
            if (!boScriptFormat) {
              boScriptFormat = "axelor";
            }
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
            if (!values.script) {
              return { script: "Must provide a value" };
            }
          },
        }}
      />
    </div>
  );
}
