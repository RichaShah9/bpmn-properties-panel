import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import ImplementationTypeHelper from "bpmn-js-properties-panel/lib/helper/ImplementationTypeHelper";
import InputOutputHelper from "bpmn-js-properties-panel/lib/helper/InputOutputHelper";

function getImplementationType(element) {
  return ImplementationTypeHelper.getImplementationType(element);
}

function getBusinessObject(element) {
  return ImplementationTypeHelper.getServiceTaskLikeBusinessObject(element);
}

function getConnector(bo) {
  return InputOutputHelper.getConnector(bo);
}

function isConnector(element) {
  return getImplementationType(element) === "connector";
}

export default function ConnectorDetailProps(
  group,
  element,
  bpmnFactory,
  translate
) {
  group.entries.push({
    id: "connectorId",
    label: translate("Connector Id"),
    modelProperty: "connectorId",
    widget: "textField",
    get: function (element, node) {
      let bo = getBusinessObject(element);
      let connector = bo && getConnector(bo);
      let value = connector && connector.get("connectorId");
      return { connectorId: value };
    },

    set: function (element, values, node) {
      let bo = getBusinessObject(element);
      let connector = getConnector(bo);
      return cmdHelper.updateBusinessObject(element, connector, {
        connectorId: values.connectorId || undefined,
      });
    },

    validate: function (element, values, node) {
      return isConnector(element) && !values.connectorId
        ? { connectorId: translate("Must provide a value") }
        : {};
    },

    hidden: function (element, node) {
      return !isConnector(element);
    },
  });
}
