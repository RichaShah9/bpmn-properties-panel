import assign from "lodash/assign";
import fieldInjection from "./implementation/FieldInjection";

export default function ListenerFieldInjectionProps(
  group,
  element,
  bpmnFactory,
  options,
  translate
) {
  options = assign(
    {
      idPrefix: "listener-",
      insideListener: true,
    },
    options
  );

  let fieldInjectionEntry = fieldInjection(
    element,
    bpmnFactory,
    translate,
    options
  );

  if (fieldInjectionEntry && fieldInjectionEntry.length > 0) {
    group.entries = group.entries.concat(fieldInjectionEntry);
  }
}
