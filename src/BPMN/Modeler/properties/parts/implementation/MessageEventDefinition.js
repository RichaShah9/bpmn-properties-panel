import eventDefinitionReference from "./EventDefinitionReference";
import elementReferenceProperty from "./ElementReferenceProperty";

export default function MessageEventDefinition(
  group,
  element,
  bpmnFactory,
  messageEventDefinition,
  translate
) {
  group.entries = group.entries.concat(
    eventDefinitionReference(element, messageEventDefinition, bpmnFactory, {
      label: translate("Message"),
      elementName: "message",
      elementType: "bpmn:Message",
      referenceProperty: "messageRef",
      newElementIdPrefix: "Message_",
    })
  );

  group.entries = group.entries.concat(
    elementReferenceProperty(element, messageEventDefinition, bpmnFactory, {
      id: "message-element-name",
      label: translate("Message Name"),
      referenceProperty: "messageRef",
      modelProperty: "name",
      shouldValidate: true,
    })
  );
}
