import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";
import forEach from "lodash/forEach";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil"
import { query as domQuery, closest as domClosest, domify } from "min-dom";
import utils from "bpmn-js-properties-panel/lib/Utils";
const { escapeHTML } = utils;

function getSelectBox(node, id) {
  let currentTab = domClosest(node, "div.bpp-properties-tab");
  let query =
    "select[name=selectedExtensionElement]" +
    (id ? "[id=cam-extensionElements-" + id + "]" : "");
  return domQuery(query, currentTab);
}

function getSelected(node, id) {
  let selectBox = getSelectBox(node, id);
  return {
    value: (selectBox || {}).value,
    idx: (selectBox || {}).selectedIndex,
  };
}

function generateElementId(prefix) {
  prefix = prefix + "_";
  return utils.nextId(prefix);
}

let CREATE_EXTENSION_ELEMENT_ACTION = "create-extension-element",
  REMOVE_EXTENSION_ELEMENT_ACTION = "remove-extension-element";

export default function ExtensionElements(
  element,
  bpmnFactory,
  options,
  translate
) {
  let id = options.id,
    prefix = options.prefix || "elem",
    label = options.label || id,
    idGeneration = options.idGeneration === false ? options.idGeneration : true,
    businessObject = options.businessObject || getBusinessObject(element);

  let modelProperty = options.modelProperty || "id";

  let getElements = options.getExtensionElements;

  let createElement = options.createExtensionElement,
    canCreate = typeof createElement === "function";

  let removeElement = options.removeExtensionElement,
    canRemove = typeof removeElement === "function";

  let onSelectionChange = options.onSelectionChange;

  let hideElements = options.hideExtensionElements,
    canBeHidden = typeof hideElements === "function";

  let setOptionLabelValue = options.setOptionLabelValue;

  let defaultSize = options.size || 5,
    resizable = options.resizable;

  let reference = options.reference || undefined;

  let selectionChanged = function (element, node, event, scope) {
    if (typeof onSelectionChange === "function") {
      return onSelectionChange(element, node, event, scope);
    }
  };

  let createOption = function (value) {
    return (
      '<option value="' +
      escapeHTML(value) +
      '" data-value data-name="extensionElementValue">' +
      escapeHTML(value) +
      "</option>"
    );
  };

  let initSelectionSize = function (selectBox, optionsLength) {
    if (resizable) {
      selectBox.size =
        optionsLength > defaultSize ? optionsLength : defaultSize;
    }
  };

  return {
    id: id,
    html:
      '<div class="bpp-row bpp-element-list" ' +
      (canBeHidden ? 'data-show="hideElements"' : "") +
      ">" +
      '<label for="cam-extensionElements-' +
      escapeHTML(id) +
      '">' +
      escapeHTML(label) +
      "</label>" +
      '<div class="bpp-field-wrapper">' +
      '<select id="cam-extensionElements-' +
      escapeHTML(id) +
      '"' +
      'name="selectedExtensionElement" ' +
      'size="' +
      escapeHTML(defaultSize) +
      '" ' +
      "data-list-entry-container " +
      'data-on-change="selectElement">' +
      "</select>" +
      (canCreate
        ? '<button class="add" ' +
          'id="cam-extensionElements-create-' +
          escapeHTML(id) +
          '" ' +
          'data-action="createElement">' +
          "<span>+</span>" +
          "</button>"
        : "") +
      (canRemove
        ? '<button class="clear" ' +
          'id="cam-extensionElements-remove-' +
          escapeHTML(id) +
          '" ' +
          'data-action="removeElement" ' +
          'data-disable="disableRemove">' +
          "<span>-</span>" +
          "</button>"
        : "") +
      "</div>" +
      "</div>",

    get: function (element, node) {
      let elements = getElements(element, node);

      let result = [];
      forEach(elements, function (elem) {
        result.push({
          extensionElementValue: elem.get(modelProperty),
        });
      });

      let selectBox = getSelectBox(node.parentNode, id);
      initSelectionSize(selectBox, result.length);

      return result;
    },

    set: function (element, values, node) {
      let action = this.__action;
      delete this.__action;

      businessObject = businessObject || getBusinessObject(element);

      let bo =
        reference && businessObject.get(reference)
          ? businessObject.get(reference)
          : businessObject;

      let extensionElements = bo.get("extensionElements");

      if (action.id === CREATE_EXTENSION_ELEMENT_ACTION) {
        let commands = [];
        if (!extensionElements) {
          extensionElements = elementHelper.createElement(
            "bpmn:ExtensionElements",
            { values: [] },
            bo,
            bpmnFactory
          );
          commands.push(
            cmdHelper.updateBusinessObject(element, bo, {
              extensionElements: extensionElements,
            })
          );
        }
        commands.push(
          createElement(element, extensionElements, action.value, node)
        );
        return commands;
      } else if (action.id === REMOVE_EXTENSION_ELEMENT_ACTION) {
        return removeElement(
          element,
          extensionElements,
          action.value,
          action.idx,
          node
        );
      }
    },

    createListEntryTemplate: function (value, index, selectBox) {
      initSelectionSize(selectBox, selectBox.options.length + 1);
      return createOption(value.extensionElementValue);
    },

    deselect: function (element, node) {
      let selectBox = getSelectBox(node, id);
      selectBox.selectedIndex = -1;
    },

    getSelected: function (element, node) {
      return getSelected(node, id);
    },

    setControlValue: function (element, node, option, property, value, idx) {
      node.value = value;

      if (!setOptionLabelValue) {
        node.text = value;
      } else {
        setOptionLabelValue(element, node, option, property, value, idx);
      }
    },

    createElement: function (element, node) {
      // create option template
      let generatedId;
      if (idGeneration) {
        generatedId = generateElementId(prefix);
      }

      let selectBox = getSelectBox(node, id);
      let template = domify(createOption(generatedId));

      // add new empty option as last child element
      selectBox.appendChild(template);

      // select last child element
      selectBox.lastChild.selected = "selected";
      selectionChanged(element, node);

      // update select box size
      initSelectionSize(selectBox, selectBox.options.length);

      this.__action = {
        id: CREATE_EXTENSION_ELEMENT_ACTION,
        value: generatedId,
      };

      return true;
    },

    removeElement: function (element, node) {
      let selection = getSelected(node, id);

      let selectBox = getSelectBox(node, id);
      selectBox.removeChild(selectBox.options[selection.idx]);

      // update select box size
      initSelectionSize(selectBox, selectBox.options.length);

      this.__action = {
        id: REMOVE_EXTENSION_ELEMENT_ACTION,
        value: selection.value,
        idx: selection.idx,
      };

      return true;
    },

    hideElements: function (element, entryNode, node, scopeNode) {
      return !hideElements(element, entryNode, node, scopeNode);
    },

    disableRemove: function (element, entryNode, node, scopeNode) {
      return (getSelected(entryNode, id) || {}).idx < 0;
    },

    selectElement: selectionChanged,
  };
}
