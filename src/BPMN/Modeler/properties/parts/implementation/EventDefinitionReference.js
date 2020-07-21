import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";

import { query as domQuery } from "min-dom";
import { domify } from "min-dom";
import { attr as domAttr } from "min-dom";

import forEach from "lodash/forEach";
import find from "lodash/find";
import utils from "bpmn-js-properties-panel/lib/Utils";
const { escapeHTML } = utils;

let selector = "select[name=selectedElement]";

/**
 * Get select box containing all elements.
 *
 * @param {DOMElement} node
 *
 * @return {DOMElement} the select box
 */
function getSelectBox(node) {
  return domQuery(selector, node.parentElement);
}

/**
 * Find element by given id.
 *
 * @param {ModdleElement} eventDefinition
 *
 * @return {ModdleElement} an element
 */
function findElementById(eventDefinition, type, id) {
  let elements = utils.findRootElementsByType(eventDefinition, type);
  return find(elements, function (element) {
    return element.id === id;
  });
}

/**
 * Create an entry to modify the reference to an element from an
 * event definition.
 *
 * @param  {djs.model.Base} element
 * @param  {ModdleElement} definition
 * @param  {BpmnFactory} bpmnFactory
 * @param  {Object} options
 * @param  {string} options.label the label of the entry
 * @param  {string} options.description the description of the entry
 * @param  {string} options.elementName the name of the element
 * @param  {string} options.elementType the type of the element
 * @param  {string} options.referenceProperty the name of referencing property
 * @param  {string} options.newElementIdPrefix the prefix of a new created element
 *
 * @return {Array<Object>} return an array containing the entries
 */
export default function EventDefinitionReference(
  element,
  definition,
  bpmnFactory,
  options
) {
  let elementName = options.elementName || "",
    elementType = options.elementType,
    referenceProperty = options.referenceProperty;

  let newElementIdPrefix = options.newElementIdPrefix || "elem_";

  let label = options.label || "",
    description = options.description || "";

  let entries = [];

  entries.push({
    id: "event-definitions-" + elementName,
    description: description,
    html:
      '<div class="bpp-row bpp-select">' +
      '<label for="camunda-' +
      escapeHTML(elementName) +
      '">' +
      escapeHTML(label) +
      "</label>" +
      '<div class="bpp-field-wrapper">' +
      '<select id="camunda-' +
      escapeHTML(elementName) +
      '" name="selectedElement" data-value>' +
      "</select>" +
      '<button class="add" id="addElement" data-action="addElement"><span>+</span></button>' +
      "</div>" +
      "</div>",

    get: function (element, entryNode) {
      utils.updateOptionsDropDown(selector, definition, elementType, entryNode);
      let reference = definition.get(referenceProperty);
      return {
        selectedElement: (reference && reference.id) || "",
      };
    },

    set: function (element, values) {
      let selection = values.selectedElement;

      let props = {};

      if (!selection || typeof selection === "undefined") {
        // remove reference to element
        props[referenceProperty] = undefined;
        return cmdHelper.updateBusinessObject(element, definition, props);
      }

      let commands = [];

      let selectedElement = findElementById(definition, elementType, selection);
      if (!selectedElement) {
        let root = utils.getRoot(definition);

        // create a new element
        selectedElement = elementHelper.createElement(
          elementType,
          { name: selection },
          root,
          bpmnFactory
        );
        commands.push(
          cmdHelper.addAndRemoveElementsFromList(
            element,
            root,
            "rootElements",
            null,
            [selectedElement]
          )
        );
      }

      // update reference to element
      props[referenceProperty] = selectedElement;
      commands.push(cmdHelper.updateBusinessObject(element, definition, props));

      return commands;
    },

    addElement: function (element, inputNode) {
      // note: this generated id will be used as name
      // of the element and not as id
      let id = utils.nextId(newElementIdPrefix);

      let optionTemplate = domify(
        '<option value="' +
          escapeHTML(id) +
          '"> (id=' +
          escapeHTML(id) +
          ")" +
          "</option>"
      );

      // add new option
      let selectBox = getSelectBox(inputNode);
      selectBox.insertBefore(optionTemplate, selectBox.firstChild);

      // select new element in the select box
      forEach(selectBox, function (option) {
        if (option.value === id) {
          domAttr(option, "selected", "selected");
        } else {
          domAttr(option, "selected", null);
        }
      });

      return true;
    },
  });

  return entries;
}