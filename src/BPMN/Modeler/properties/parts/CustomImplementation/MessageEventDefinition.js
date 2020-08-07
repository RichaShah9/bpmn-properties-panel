import React from "react";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import utils from "bpmn-js-properties-panel/lib/Utils";

import { TextField } from "../../components";
import { translate } from "../../../../../utils";

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
          set: function (element, values) {
            let root = utils.getRoot(messageEventDefinition);
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
          },
          get: function () {
            let reference = messageEventDefinition.get("messageRef");
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
