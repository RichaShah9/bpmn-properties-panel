import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";

const DELEGATE_TYPES = ["class", "expression", "delegateExpression"];

const PROPERTIES = {
  class: "camunda:class",
  expression: "camunda:expression",
  delegateExpression: "camunda:delegateExpression",
};

function isDelegate(type) {
  return DELEGATE_TYPES.indexOf(type) !== -1;
}

function getAttribute(type) {
  return PROPERTIES[type];
}

export default function Delegate(element, bpmnFactory, options, translate) {
  let getImplementationType = options.getImplementationType,
    getBusinessObject = options.getBusinessObject;

  function getDelegationLabel(type) {
    switch (type) {
      case "class":
        return translate("Java Class");
      case "expression":
        return translate("Expression");
      case "delegateExpression":
        return translate("Delegate Expression");
      default:
        return "";
    }
  }

  let delegateEntry = {
    id: "delegate",
    label: translate("Value"),
    dataValueLabel: "delegationLabel",
    modelProperty: "delegate",
    widget: "textField",
    get: function (element, node) {
      let bo = getBusinessObject(element);
      let type = getImplementationType(element);
      let attr = getAttribute(type);
      let label = getDelegationLabel(type);
      return {
        delegate: bo.get(attr),
        delegationLabel: label,
      };
    },

    set: function (element, values, node) {
      let bo = getBusinessObject(element);
      let type = getImplementationType(element);
      let attr = getAttribute(type);
      let prop = {};
      prop[attr] = values.delegate || "";
      return cmdHelper.updateBusinessObject(element, bo, prop);
    },

    validate: function (element, values, node) {
      return isDelegate(getImplementationType(element)) && !values.delegate
        ? { delegate: translate("Must provide a value") }
        : {};
    },

    hidden: function (element, node) {
      return !isDelegate(getImplementationType(element));
    },
  };

  return [delegateEntry];
}
