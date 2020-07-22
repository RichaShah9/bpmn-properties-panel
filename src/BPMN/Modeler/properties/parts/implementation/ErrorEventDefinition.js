import eventDefinitionReference from "./EventDefinitionReference";
import elementReferenceProperty from "./ElementReferenceProperty";
import { translate } from "../../../../../utils";

export default function ErrorEventDefinition(
  group,
  element,
  bpmnFactory,
  errorEventDefinition
) {
  group.entries = group.entries.concat(
    eventDefinitionReference(element, errorEventDefinition, bpmnFactory, {
      label: translate("Error"),
      elementName: "error",
      elementType: "bpmn:Error",
      referenceProperty: "errorRef",
      newElementIdPrefix: "Error_",
    })
  );

  group.entries = group.entries.concat(
    elementReferenceProperty(element, errorEventDefinition, bpmnFactory, {
      id: "error-element-name",
      label: translate("Error Name"),
      referenceProperty: "errorRef",
      modelProperty: "name",
      shouldValidate: true,
    })
  );

  group.entries = group.entries.concat(
    elementReferenceProperty(element, errorEventDefinition, bpmnFactory, {
      id: "error-element-code",
      label: translate("Error Code"),
      referenceProperty: "errorRef",
      modelProperty: "errorCode",
    })
  );
}
