import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import utils from "bpmn-js-properties-panel/lib/Utils";

export default function MessageEventDefinition(
  group,
  element,
  bpmnFactory,
  messageEventDefinition,
  translate
) {
  group.entries = group.entries.concat({
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
        ele.$parent.rootElements.findIndex((message) => message.id === ele.id);
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
  });
}
