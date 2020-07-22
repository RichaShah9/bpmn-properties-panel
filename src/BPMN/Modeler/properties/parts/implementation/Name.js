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
export default function Name(element, options, translate) {
  options = options || {};
  var id = options.id || "name",
    label = options.label || translate("Name"),
    modelProperty = options.modelProperty || "name";

  var nameEntry = {
    id: id,
    label: label,
    modelProperty: modelProperty,
    widget: "textBox",
    get: options.get,
    set: options.set,
  };

  return [nameEntry];
}
