import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import inputOutputHelper from "bpmn-js-properties-panel/lib/helper/InputOutputHelper";
import utils from "bpmn-js-properties-panel/lib/Utils";
import scriptImplementation from "./Script";
import { is } from "bpmn-js/lib/util/ModelUtil";

function createElement(type, parent, factory, properties) {
  return elementHelper.createElement(type, properties, parent, factory);
}

function isScript(elem) {
  return is(elem, "camunda:Script");
}

function isList(elem) {
  return is(elem, "camunda:List");
}

function isMap(elem) {
  return is(elem, "camunda:Map");
}

function ensureInputOutputSupported(element, insideConnector) {
  return inputOutputHelper.isInputOutputSupported(element, insideConnector);
}

export default function InputOutputParameter(
  element,
  bpmnFactory,
  options,
  translate
) {
  let typeInfo = {
    "camunda:Map": {
      value: "map",
      label: translate("Map"),
    },
    "camunda:List": {
      value: "list",
      label: translate("List"),
    },
    "camunda:Script": {
      value: "script",
      label: translate("Script"),
    },
  };

  options = options || {};

  let insideConnector = !!options.insideConnector,
    idPrefix = options.idPrefix || "";

  let getSelected = options.getSelectedParameter;

  if (!ensureInputOutputSupported(element, insideConnector)) {
    return [];
  }

  let entries = [];

  let isSelected = function (element, node) {
    return getSelected(element, node);
  };

  // parameter name ////////////////////////////////////////////////////////

  entries.push({
    id: idPrefix + "parameterName",
    label: translate("Name"),
    modelProperty: "name",
    widget: "textField", //validationAwareTextField
    getProperty: function (element, node) {
      return (getSelected(element, node) || {}).name;
    },

    setProperty: function (element, values, node) {
      let param = getSelected(element, node);
      return cmdHelper.updateBusinessObject(element, param, values);
    },

    validate: function (element, values, node) {
      let bo = getSelected(element, node);

      let validation = {};
      if (bo) {
        let nameValue = values.name;

        if (nameValue) {
          if (utils.containsSpace(nameValue)) {
            validation.name = translate("Name must not contain spaces");
          }
        } else {
          validation.name = translate("Parameter must have a name");
        }
      }

      return validation;
    },

    hidden: function (element, node) {
      return !isSelected(element, node);
    },
  });

  // parameter type //////////////////////////////////////////////////////

  let selectOptions = [
    { value: "text", name: translate("Text") },
    { value: "script", name: translate("Script") },
    { value: "list", name: translate("List") },
    { value: "map", name: translate("Map") },
  ];

  entries.push({
    id: idPrefix + "parameterType",
    label: translate("Type"),
    selectOptions: selectOptions,
    modelProperty: "parameterType",
    widget: "selectBox",
    get: function (element, node) {
      let bo = getSelected(element, node);

      let parameterType = "text";

      if (typeof bo !== "undefined") {
        let definition = bo.get("definition");
        if (typeof definition !== "undefined") {
          let type = definition.$type;
          parameterType = typeInfo[type].value;
        }
      }

      return {
        parameterType: parameterType,
      };
    },

    set: function (element, values, node) {
      let bo = getSelected(element, node);

      let properties = {
        value: undefined,
        definition: undefined,
      };

      let createParameterTypeElem = function (type) {
        return createElement(type, bo, bpmnFactory);
      };

      let parameterType = values.parameterType;

      if (parameterType === "script") {
        properties.definition = createParameterTypeElem("camunda:Script");
      } else if (parameterType === "list") {
        properties.definition = createParameterTypeElem("camunda:List");
      } else if (parameterType === "map") {
        properties.definition = createParameterTypeElem("camunda:Map");
      }

      return cmdHelper.updateBusinessObject(element, bo, properties);
    },

    show: function (element, node) {
      return isSelected(element, node);
    },
  });

  // parameter value (type = text) ///////////////////////////////////////////////////////

  entries.push({
    id: idPrefix + "parameterType-text",
    label: translate("Value"),
    modelProperty: "value",
    widget: "textBox",
    get: function (element, node) {
      return {
        value: (getSelected(element, node) || {}).value,
      };
    },

    set: function (element, values, node) {
      let param = getSelected(element, node);
      values.value = values.value || undefined;
      return cmdHelper.updateBusinessObject(element, param, values);
    },

    show: function (element, node) {
      let bo = getSelected(element, node);
      return bo && !bo.definition;
    },
  });

  // parameter value (type = script) ///////////////////////////////////////////////////////
  let script = scriptImplementation("scriptFormat", "value", true, translate);
  entries.push({
    id: idPrefix + "parameterType-script",
    get: function (element, node) {
      let bo = getSelected(element, node);
      return bo && isScript(bo.definition)
        ? script.get(element, bo.definition)
        : {};
    },

    set: function (element, values, node) {
      let bo = getSelected(element, node);
      let update = script.set(element, values);
      return cmdHelper.updateBusinessObject(element, bo.definition, update);
    },

    validate: function (element, values, node) {
      let bo = getSelected(element, node);
      return bo && isScript(bo.definition)
        ? script.validate(element, bo.definition)
        : {};
    },

    isScript: function (element, node) {
      let bo = getSelected(element, node);
      return bo && isScript(bo.definition);
    },

    script: script,
  });

  // parameter value (type = list) ///////////////////////////////////////////////////////

  entries.push({
    id: idPrefix + "parameterType-list",
    modelProperties: ["value"],
    labels: [translate("Value")],
    addLabel: translate("Add Value"),
    widget: "table",
    getElements: function (element, node) {
      let bo = getSelected(element, node);

      if (bo && isList(bo.definition)) {
        return bo.definition.items;
      }

      return [];
    },

    updateElement: function (element, values, node, idx) {
      let bo = getSelected(element, node);
      let item = bo.definition.items[idx];
      return cmdHelper.updateBusinessObject(element, item, values);
    },

    addElement: function (element, node) {
      let bo = getSelected(element, node);
      let newValue = createElement(
        "camunda:Value",
        bo.definition,
        bpmnFactory,
        { value: undefined }
      );
      return cmdHelper.addElementsTolist(element, bo.definition, "items", [
        newValue,
      ]);
    },

    removeElement: function (element, node, idx) {
      let bo = getSelected(element, node);
      return cmdHelper.removeElementsFromList(
        element,
        bo.definition,
        "items",
        null,
        [bo.definition.items[idx]]
      );
    },

    editable: function (element, node, prop, idx) {
      let bo = getSelected(element, node);
      let item = bo.definition.items[idx];
      return !isMap(item) && !isList(item) && !isScript(item);
    },

    setControlValue: function (element, node, input, prop, value, idx) {
      let bo = getSelected(element, node);
      let item = bo.definition.items[idx];

      if (!isMap(item) && !isList(item) && !isScript(item)) {
        input.value = value;
      } else {
        input.value = typeInfo[item.$type].label;
      }
    },

    show: function (element, node) {
      let bo = getSelected(element, node);
      return bo && bo.definition && isList(bo.definition);
    },
  });

  // parameter value (type = map) ///////////////////////////////////////////////////////

  entries.push({
    id: idPrefix + "parameterType-map",
    modelProperties: ["key", "value"],
    labels: [translate("Key"), translate("Value")],
    addLabel: translate("Add Entry"),
    widget: "table",
    getElements: function (element, node) {
      let bo = getSelected(element, node);

      if (bo && isMap(bo.definition)) {
        return bo.definition.entries;
      }

      return [];
    },

    updateElement: function (element, values, node, idx) {
      let bo = getSelected(element, node);
      let entry = bo.definition.entries[idx];

      if (
        isMap(entry.definition) ||
        isList(entry.definition) ||
        isScript(entry.definition)
      ) {
        values = {
          key: values.key,
        };
      }

      return cmdHelper.updateBusinessObject(element, entry, values);
    },

    addElement: function (element, node) {
      let bo = getSelected(element, node);
      let newEntry = createElement(
        "camunda:Entry",
        bo.definition,
        bpmnFactory,
        { key: undefined, value: undefined }
      );
      return cmdHelper.addElementsTolist(element, bo.definition, "entries", [
        newEntry,
      ]);
    },

    removeElement: function (element, node, idx) {
      let bo = getSelected(element, node);
      return cmdHelper.removeElementsFromList(
        element,
        bo.definition,
        "entries",
        null,
        [bo.definition.entries[idx]]
      );
    },

    editable: function (element, node, prop, idx) {
      let bo = getSelected(element, node);
      let entry = bo.definition.entries[idx];
      return (
        prop === "key" ||
        (!isMap(entry.definition) &&
          !isList(entry.definition) &&
          !isScript(entry.definition))
      );
    },

    setControlValue: function (element, node, input, prop, value, idx) {
      let bo = getSelected(element, node);
      let entry = bo.definition.entries[idx];

      if (
        prop === "key" ||
        (!isMap(entry.definition) &&
          !isList(entry.definition) &&
          !isScript(entry.definition))
      ) {
        input.value = value;
      } else {
        input.value = typeInfo[entry.definition.$type].label;
      }
    },

    show: function (element, node) {
      let bo = getSelected(element, node);
      return bo && bo.definition && isMap(bo.definition);
    },
  });

  return entries;
}
