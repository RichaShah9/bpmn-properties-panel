import React from "react";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import utils from "bpmn-js-properties-panel/lib/Utils";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";

import { TextField } from "../../components";
import { translate } from "../../../../../utils";

const setProperty = (name, value, element) => {
  const bo = getBusinessObject(element);
  if (!bo) return;
  if (bo.$attrs) {
    if (!value) {
      delete bo.$attrs[name];
      return;
    }
    bo.$attrs[name] = value;
  } else {
    if (!value) {
      return;
    }
    bo.$attrs = { [name]: value };
  }
};

export default function MessageProps({
  element,
  bpmnFactory,
  messageEventDefinition,
}) {
  return (
    <div>
      <TextField
        element={element}
        entry={{
          id: "message-element-name",
          label: translate("Message Name"),
          referenceProperty: "messageRef",
          modelProperty: "name",
          shouldValidate: true,
          elementType: "bpmn:Message",
          set: function (e, values) {
            let root = utils.getRoot(messageEventDefinition);
            if (is(element, "bpmn:SendTask")) {
              setProperty("camunda:messageName", values["name"], element);
            }
            if (messageEventDefinition.messageRef) {
              messageEventDefinition.messageRef.name = values["name"];
            } else {
              let ele = elementHelper.createElement(
                "bpmn:Message",
                { name: values["name"] },
                root,
                bpmnFactory
              );
              messageEventDefinition.messageRef = ele;
              let index =
                ele.$parent.rootElements &&
                ele.$parent.rootElements.findIndex(
                  (message) => message.id === ele.id
                );
              if (index < 0) {
                ele.$parent.rootElements.push(ele);
              }
            }
          },
          get: function () {
            let reference =
              messageEventDefinition &&
              messageEventDefinition.get("messageRef");
            let props = {};
            props["name"] = reference && reference.get("name");
            return props;
          },
        }}
        canRemove={true}
      />
    </div>
  );
}
