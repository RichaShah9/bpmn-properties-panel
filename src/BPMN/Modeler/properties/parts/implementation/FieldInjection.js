import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import extensionElementsHelper from "bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper";
import utils from "bpmn-js-properties-panel/lib/Utils";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import assign from "lodash/assign";
import extensionElementsEntry from "./ExtensionElements";

let DEFAULT_PROPS = {
  stringValue: undefined,
  string: undefined,
  expression: undefined,
};

let CAMUNDA_FIELD_EXTENSION_ELEMENT = "camunda:Field";

export default function FieldInjection(
  element,
  bpmnFactory,
  translate,
  options
) {
  options = options || {};

  let insideListener = !!options.insideListener,
    idPrefix = options.idPrefix || "",
    getSelectedListener = options.getSelectedListener,
    businessObject = options.businessObject || getBusinessObject(element);

  let entries = [];

  let isSelected = function (element, node) {
    return getSelectedField(element, node);
  };

  function getSelectedField(element, node) {
    if(!node) return
    let selected = fieldEntry.getSelected(element, node.parentNode);

    if (selected.idx === -1) {
      return;
    }

    let fields = getCamundaFields(element, node);

    return fields[selected.idx];
  }

  function getCamundaFields(element, node) {
    if (!insideListener) {
      return (
        (businessObject &&
          extensionElementsHelper.getExtensionElements(
            businessObject,
            CAMUNDA_FIELD_EXTENSION_ELEMENT
          )) ||
        []
      );
    }
    return getCamundaListenerFields(element, node);
  }

  function getCamundaListenerFields(element, node) {
    let selectedListener = getSelectedListener(element, node);
    return (selectedListener && selectedListener.fields) || [];
  }

  function getFieldType(bo) {
    let fieldType = "string";

    let expressionValue = bo && bo.expression;
    let stringValue = bo && (bo.string || bo.stringValue);

    if (typeof stringValue !== "undefined") {
      fieldType = "string";
    } else if (typeof expressionValue !== "undefined") {
      fieldType = "expression";
    }

    return fieldType;
  }

  let setOptionLabelValue = function () {
    return function (element, node, option, property, value, idx) {
      let camundaFields = getCamundaFields(element, node);
      let field = camundaFields[idx];

      value = field.name ? field.name : "<empty>";

      let label = idx + " : " + value;

      option.text = label;
    };
  };

  let newElement = function () {
    return function (element, extensionElements, value, node) {
      let props = {
        name: "",
        string: "",
      };

      let newFieldElem;

      if (!insideListener) {
        newFieldElem = elementHelper.createElement(
          CAMUNDA_FIELD_EXTENSION_ELEMENT,
          props,
          extensionElements,
          bpmnFactory
        );
        return cmdHelper.addElementsTolist(
          element,
          extensionElements,
          "values",
          [newFieldElem]
        );
      } else {
        let selectedListener = getSelectedListener(element, node);
        newFieldElem = elementHelper.createElement(
          CAMUNDA_FIELD_EXTENSION_ELEMENT,
          props,
          selectedListener,
          bpmnFactory
        );
        return cmdHelper.addElementsTolist(
          element,
          selectedListener,
          "fields",
          [newFieldElem]
        );
      }
    };
  };

  let removeElement = function () {
    return function (element, extensionElements, value, idx, node) {
      let camundaFields = getCamundaFields(element, node);
      let field = camundaFields[idx];
      if (field) {
        if (!insideListener) {
          return extensionElementsHelper.removeEntry(
            businessObject,
            element,
            field
          );
        }
        let selectedListener = getSelectedListener(element, node);
        return cmdHelper.removeElementsFromList(
          element,
          selectedListener,
          "fields",
          null,
          [field]
        );
      }
    };
  };

  let fieldEntry = extensionElementsEntry(element, bpmnFactory, {
    id: idPrefix + "fields",
    label: translate("Fields"),
    modelProperty: "fieldName",
    idGeneration: "false",
    widget: "extensionElementTable",
    businessObject: businessObject,

    createExtensionElement: newElement(),
    removeExtensionElement: removeElement(),

    getExtensionElements: function (element, node) {
      return getCamundaFields(element, node);
    },

    setOptionLabelValue: setOptionLabelValue(),
  });
  entries.push(fieldEntry);

  entries.push({
    id: idPrefix + "field-name",
    label: translate("Name"),
    modelProperty: "fieldName",
    widget: "textField", //validationAwareTextField
    getProperty: function (element, node) {
      return (getSelectedField(element, node) || {}).name;
    },

    setProperty: function (element, values, node) {
      let selectedField = getSelectedField(element, node);
      return cmdHelper.updateBusinessObject(element, selectedField, {
        name: values.fieldName,
      });
    },

    validate: function (element, values, node) {
      let bo = getSelectedField(element, node);

      let validation = {};
      if (bo) {
        let nameValue = values.fieldName;

        if (nameValue) {
          if (utils.containsSpace(nameValue)) {
            validation.fieldName = translate("Name must not contain spaces");
          }
        } else {
          validation.fieldName = translate("Parameter must have a name");
        }
      }

      return validation;
    },

    hidden: function (element, node) {
      return !isSelected(element, node);
    },
  });

  let fieldTypeOptions = [
    {
      name: translate("String"),
      value: "string",
    },
    {
      name: translate("Expression"),
      value: "expression",
    },
  ];

  entries.push({
    id: idPrefix + "field-type",
    label: translate("Type"),
    selectOptions: fieldTypeOptions,
    modelProperty: "fieldType",
    widget: "selectBox",
    get: function (element, node) {
      let bo = getSelectedField(element, node);

      let fieldType = getFieldType(bo);

      return {
        fieldType: fieldType,
      };
    },

    set: function (element, values, node) {
      let props = assign({}, DEFAULT_PROPS);

      let fieldType = values.fieldType;

      if (fieldType === "string") {
        props.string = "";
      } else if (fieldType === "expression") {
        props.expression = "";
      }

      return cmdHelper.updateBusinessObject(
        element,
        getSelectedField(element, node),
        props
      );
    },

    hidden: function (element, node) {
      return !isSelected(element, node);
    },
  });

  entries.push({
    id: idPrefix + "field-value",
    label: translate("Value"),
    modelProperty: "fieldValue",
    widget: "textBox",
    get: function (element, node) {
      let bo = getSelectedField(element, node);
      let fieldType = getFieldType(bo);

      let fieldValue;

      if (fieldType === "string") {
        fieldValue = bo && (bo.string || bo.stringValue);
      } else if (fieldType === "expression") {
        fieldValue = bo && bo.expression;
      }

      return {
        fieldValue: fieldValue,
      };
    },

    set: function (element, values, node) {
      let bo = getSelectedField(element, node);
      let fieldType = getFieldType(bo);

      let props = assign({}, DEFAULT_PROPS);

      let fieldValue = values.fieldValue || undefined;

      if (fieldType === "string") {
        props.string = fieldValue;
      } else if (fieldType === "expression") {
        props.expression = fieldValue;
      }

      return cmdHelper.updateBusinessObject(element, bo, props);
    },

    validate: function (element, values, node) {
      let bo = getSelectedField(element, node);

      let validation = {};
      if (bo) {
        if (!values.fieldValue) {
          validation.fieldValue = translate("Must provide a value");
        }
      }

      return validation;
    },

    show: function (element, node) {
      return isSelected(element, node);
    },
  });

  return entries;
}
