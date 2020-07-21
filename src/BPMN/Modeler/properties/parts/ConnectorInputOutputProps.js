import inputOutput from './implementation/InputOutput';

export default function ConnectorInputOutputProps(group, element, bpmnFactory, translate) {

  var inputOutputEntry = inputOutput(element, bpmnFactory, {
    idPrefix: 'connector-',
    insideConnector: true
  }, translate);

  group.entries = group.entries.concat(inputOutputEntry.entries);

  return {
    getSelectedParameter: inputOutputEntry.getSelectedParameter
  };

};
