import React, { useEffect, useState } from "react";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import { Textbox } from "../../components";
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
                element.businessObject.scriptFormat = "axelor";
                element.businessObject.resource = undefined;
              }
            },
            validate: function (e, values) {
              if (!values.script && scriptType === "script") {
                return { script: "Must provide a value" };
              }
            },
          }}
        />
      )}
    </div>
  );
}
