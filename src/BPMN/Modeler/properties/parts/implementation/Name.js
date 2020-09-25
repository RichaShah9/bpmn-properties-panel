import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

/**
 * Create an entry to modify the name of an an element.
 *
 * @param  {djs.model.Base} element
 * @param  {Object} options
 * @param  {string} options.id the id of the entry
 * @param  {string} options.label the label of the entry
 *
 * @return {Array<Object>} return an array containing
 *                         the entry to modify the name
 */
export default function Name(element, options, translate, bpmnModeler) {
  options = options || {};
  let id = options.id || "name",
    label = options.label || translate("Name"),
    modelProperty = options.modelProperty || "name";

  const get = function () {
    let bo = getBusinessObject(element);
    let originalValue = `value:${bo.get([modelProperty])}`;
    let key = element.businessObject.key || bo.get([modelProperty]);
    let translatedValue = translate(`value:${key}`);
    let value =
      translatedValue === originalValue
        ? bo.get([modelProperty])
        : translatedValue;
    return { [modelProperty]: value };
  };

  const set = function (element, values, readOnly) {
    if (element.businessObject) {
      element.businessObject[modelProperty] = values[modelProperty];
    } else {
      element[modelProperty] = values[modelProperty];
    }
    if (!bpmnModeler || !element) return;
    let elementRegistry = bpmnModeler.get("elementRegistry");
    let modeling = bpmnModeler.get("modeling");
    let shape = elementRegistry.get(element.id);
    if (!shape) return;
    let originalValue = `value:${values[modelProperty]}`;
    let translatedValue = translate(`value:${values[modelProperty]}`);
    let value = !readOnly
      ? values[modelProperty]
      : translatedValue === originalValue
      ? values[modelProperty]
      : translatedValue;
    modeling &&
      modeling.updateProperties(shape, {
        [modelProperty]: value,
      });
  };

  let nameEntry = {
    id: id,
    label: label,
    modelProperty: modelProperty,
    widget: "textBox",
    get: options.get || get,
    set: options.set || set,
  };

  return [nameEntry];
}
