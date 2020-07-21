import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import scriptImplementation from "./implementation/Script";
import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

export default function ScriptTaskProps(
  group,
  element,
  bpmnFactory,
  translate
) {
  let bo;

  if (is(element, "bpmn:ScriptTask")) {
    bo = getBusinessObject(element);
  }

  if (!bo) {
    return;
  }

  let script = scriptImplementation("scriptFormat", "script", false, translate);
  group.entries.push({
    id: "script-implementation",
    label: translate("Script"),
    html: script.template,

    get: function (element) {
      return script.get(element, bo);
    },

    set: function (element, values, containerElement) {
      let properties = script.set(element, values, containerElement);

      return cmdHelper.updateProperties(element, properties);
    },

    validate: function (element, values) {
      return script.validate(element, values);
    },

    script: script,

    cssClasses: ["bpp-textfield"],
  });

  group.entries.push({
    id: "scriptResultVariable",
    label: translate("Result Variable"),
    modelProperty: "scriptResultVariable",
    widget: "textField",
    get: function (element, propertyName) {
      let boResultVariable = bo.get("camunda:resultVariable");

      return { scriptResultVariable: boResultVariable };
    },

    set: function (element, values, containerElement) {
      return cmdHelper.updateProperties(element, {
        "camunda:resultVariable": values.scriptResultVariable.length
          ? values.scriptResultVariable
          : undefined,
      });
    },
  });
}
