import assign from "lodash/assign";
import inputOutputParameter from "./implementation/InputOutputParameter";

export default function ConnectorInputOutputParameterProps(
  group,
  element,
  bpmnFactory,
  options,
  translate
) {
  options = assign(
    {
      idPrefix: "connector-",
      insideConnector: true,
    },
    options
  );

  group.entries = group.entries.concat(
    inputOutputParameter(element, bpmnFactory, options, translate)
  );
}
