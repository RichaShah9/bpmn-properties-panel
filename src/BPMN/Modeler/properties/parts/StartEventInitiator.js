import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

export default function StartEventInitiator(group, element, translate) {
  let bo = getBusinessObject(element);

  if (!bo) {
    return;
  }

  if (
    is(element, "camunda:Initiator") &&
    !is(element.parent, "bpmn:SubProcess")
  ) {
    group.entries.push({
      id: "initiator",
      label: translate("Initiator"),
      modelProperty: "initiator",
      widget: "textField",
      get: function () {
        return { initiator: bo.get("initiator") };
      },
      set: function (element, values) {
        element.businessObject.initiator = values["initiator"];
      },
    });
  }
}
