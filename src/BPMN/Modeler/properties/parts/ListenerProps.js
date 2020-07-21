import listener from "./implementation/Listener";

export default function ListenerProps(group, element, bpmnFactory, translate) {
  let listenerEntry = listener(element, bpmnFactory, {}, translate);

  group.entries = group.entries.concat(listenerEntry.entries);

  return {
    getSelectedListener: listenerEntry.getSelectedListener,
  };
}
