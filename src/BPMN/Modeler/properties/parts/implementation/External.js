import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";

export default function External(element, bpmnFactory, options, translate) {
  let getImplementationType = options.getImplementationType,
    getBusinessObject = options.getBusinessObject;

  function isExternal(element) {
    return getImplementationType(element) === "external";
  }

  let topicEntry = {
    id: "externalTopic",
    label: translate("Topic"),
    modelProperty: "externalTopic",
    widget: "textField",
    get: function (element, node) {
      let bo = getBusinessObject(element);
      return { externalTopic: bo.get("camunda:topic") };
    },

    set: function (element, values, node) {
      let bo = getBusinessObject(element);
      return cmdHelper.updateBusinessObject(element, bo, {
        "camunda:topic": values.externalTopic,
      });
    },

    validate: function (element, values, node) {
      return isExternal(element) && !values.externalTopic
        ? { externalTopic: translate("Must provide a value") }
        : {};
    },

    hidden: function (element, node) {
      return !isExternal(element);
    },
  };

  return [topicEntry];
}
