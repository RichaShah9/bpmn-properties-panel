import ImplementationTypeHelper from "bpmn-js-properties-panel/lib/helper/ImplementationTypeHelper";
import fieldInjection from "./implementation/FieldInjection";

export default function FieldInjectionProps(
  group,
  element,
  bpmnFactory,
  translate
) {
  let bo = ImplementationTypeHelper.getServiceTaskLikeBusinessObject(element);

  if (!bo) {
    return;
  }

  let fieldInjectionEntry = fieldInjection(element, bpmnFactory, translate, {
    businessObject: bo,
  });

  if (fieldInjectionEntry && fieldInjectionEntry.length > 0) {
    group.entries = group.entries.concat(fieldInjectionEntry);
  }
}
