import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";

/**
 * Create an entry to modify a property of an element which
 * is referenced by a event definition.
 *
 * @param  {djs.model.Base} element
 * @param  {ModdleElement} definition
 * @param  {BpmnFactory} bpmnFactory
 * @param  {Object} options
 * @param  {string} options.id the id of the entry
 * @param  {string} options.label the label of the entry
 * @param  {string} options.referenceProperty the name of referencing property
 * @param  {string} options.modelProperty the name of property to modify
 * @param  {string} options.shouldValidate a flag indicate whether to validate or not
 *
 * @return {Array<Object>} return an array containing the entries
 */
export default function ElementReferenceProperty(
  element,
  definition,
  bpmnFactory,
  options
) {
  let id = options.id || "element-property";
  let label = options.label;
  let referenceProperty = options.referenceProperty;
  let modelProperty = options.modelProperty || "name";
  let shouldValidate = options.shouldValidate || false;

  let entry = {
    id: id,
    label: label,
    modelProperty: modelProperty,
    widget: "textField",
    get: function (element, node) {
      let reference = definition.get(referenceProperty);
      let props = {};
      props[modelProperty] = reference && reference.get(modelProperty);
      return props;
    },

    set: function (element, values, node) {
      let reference = definition.get(referenceProperty);
      let props = {};
      props[modelProperty] = values[modelProperty] || undefined;
      return cmdHelper.updateBusinessObject(element, reference, props);
    },

    hidden: function (element, node) {
      return !definition.get(referenceProperty);
    },
  };

  if (shouldValidate) {
    entry.validate = function (element, values, node) {
      let reference = definition.get(referenceProperty);
      if (reference && !values[modelProperty]) {
        let validationErrors = {};
        validationErrors[modelProperty] = "Must provide a value";
        return validationErrors;
      }
    };
  }

  return [entry];
}
